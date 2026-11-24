"""
Storage Blueprint  —  /api/storage
Provides secure, authenticated file upload/download/delete endpoints.
The SUPABASE_SERVICE_ROLE_KEY never leaves the backend.
"""
import io
import logging
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app.db import SessionLocal
from app.models.file_attachment import FileAttachment
from app.models.user import Role
from app.models.base import generate_uuid
from app.permissions.decorators import roles_required
from app.services.storage_service import (
    SupabaseStorageService,
    is_supabase_configured,
    PRIVATE_BUCKET,
    PUBLIC_BUCKET,
    SIGNED_URL_EXPIRY,
)

storage_bp = Blueprint("storage", __name__, url_prefix="/api/storage")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ALLOWED_UPLOAD_ROLES = {
    Role.ADMIN,
    Role.PRODUCTION,
}

DOWNLOAD_ROLES = {
    Role.ADMIN,
    Role.PRODUCTION,
    Role.AUDITOR,
    Role.OWNER,
}

PRODUCT_IMAGE_ROLES = {Role.ADMIN}

DELETE_ROLES = {Role.ADMIN}


def _check_supabase() -> tuple | None:
    if not is_supabase_configured():
        return jsonify({
            "error": "Supabase not configured",
            "message": (
                "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file. "
                "See .env.example for instructions."
            )
        }), 503
    return None


def _get_role() -> str:
    claims = get_jwt()
    return claims.get("role", "")


# ---------------------------------------------------------------------------
# Health / status endpoint
# ---------------------------------------------------------------------------

@storage_bp.route("/status", methods=["GET"])
@jwt_required()
def storage_status():
    """Return whether Supabase Storage is configured."""
    configured = is_supabase_configured()
    return jsonify({
        "configured": configured,
        "private_bucket": PRIVATE_BUCKET,
        "public_bucket":  PUBLIC_BUCKET,
        "message": "Supabase Storage is active." if configured else
                   "Supabase credentials not configured. Upload functionality is disabled.",
    }), 200


# ---------------------------------------------------------------------------
# Upload private document  POST /api/storage/documents
# ---------------------------------------------------------------------------

@storage_bp.route("/documents", methods=["POST"])
@jwt_required()
def upload_document():
    """
    Upload a file to the private erp-documents bucket.
    Required form fields:
        file          — multipart file
        document_type — invoice | purchase_bill | payment_receipt |
                        production_report | dispatch_proof | audit_attachment
        reference_id  — UUID of the linked ERP record
    Roles allowed: ADMIN, PRODUCTION
    """
    guard = _check_supabase()
    if guard:
        return guard

    role = _get_role()
    if role not in ALLOWED_UPLOAD_ROLES:
        return jsonify({"error": "Forbidden", "message": "Only ADMIN and PRODUCTION roles may upload documents."}), 403

    if "file" not in request.files:
        return jsonify({"error": "No file part in request."}), 400

    file        = request.files["file"]
    doc_type    = request.form.get("document_type", "").strip()
    reference_id = request.form.get("reference_id", "").strip()

    if not file.filename:
        return jsonify({"error": "No file selected."}), 400
    if not doc_type:
        return jsonify({"error": "document_type is required."}), 400
    if not reference_id:
        return jsonify({"error": "reference_id is required."}), 400

    file_bytes = file.read()
    uploader_id = get_jwt_identity()

    try:
        result = SupabaseStorageService.upload_private_document(
            file_bytes=file_bytes,
            original_filename=file.filename,
            document_type=doc_type,
            reference_id=reference_id,
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 422
    except Exception as exc:
        logger.exception("Storage upload error: %s", exc)
        return jsonify({"error": "Upload failed.", "detail": str(exc)}), 500

    # Persist metadata to PostgreSQL
    db = SessionLocal()
    try:
        attachment = FileAttachment(
            document_type=doc_type,
            reference_id=reference_id,
            storage_path=result["storage_path"],
            bucket=result["bucket"],
            public_url=result["public_url"],
            original_name=result["original_name"],
            mime_type=result["mime_type"],
            size_bytes=result["size_bytes"],
            uploaded_by_id=uploader_id,
        )
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
        return jsonify({"message": "File uploaded successfully.", "attachment": attachment.to_dict()}), 201
    except Exception as exc:
        db.rollback()
        # Try to clean up orphan file in Supabase
        try:
            SupabaseStorageService.delete_file(result["storage_path"])
        except Exception:
            pass
        logger.exception("DB save failed after upload: %s", exc)
        return jsonify({"error": "Upload succeeded but metadata could not be saved.", "detail": str(exc)}), 500
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Upload product image  POST /api/storage/product-images
# ---------------------------------------------------------------------------

@storage_bp.route("/product-images", methods=["POST"])
@jwt_required()
def upload_product_image():
    """
    Upload a product image to the public erp-product-images bucket.
    Required form fields:
        file       — multipart image file
        product_id — UUID of the product
    Roles allowed: ADMIN
    """
    guard = _check_supabase()
    if guard:
        return guard

    role = _get_role()
    if role not in PRODUCT_IMAGE_ROLES:
        return jsonify({"error": "Forbidden", "message": "Only ADMIN role may upload product images."}), 403

    if "file" not in request.files:
        return jsonify({"error": "No file part in request."}), 400

    file       = request.files["file"]
    product_id = request.form.get("product_id", "").strip()

    if not file.filename:
        return jsonify({"error": "No file selected."}), 400
    if not product_id:
        return jsonify({"error": "product_id is required."}), 400

    file_bytes  = file.read()
    uploader_id = get_jwt_identity()

    try:
        result = SupabaseStorageService.upload_product_image(
            file_bytes=file_bytes,
            original_filename=file.filename,
            product_id=product_id,
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 422
    except Exception as exc:
        logger.exception("Product image upload error: %s", exc)
        return jsonify({"error": "Upload failed.", "detail": str(exc)}), 500

    db = SessionLocal()
    try:
        # Remove old image metadata for this product (soft or replace)
        db.query(FileAttachment).filter_by(
            reference_id=product_id, document_type="product_image", is_deleted=False
        ).update({"is_deleted": True})

        attachment = FileAttachment(
            document_type="product_image",
            reference_id=product_id,
            storage_path=result["storage_path"],
            bucket=result["bucket"],
            public_url=result["public_url"],
            original_name=result["original_name"],
            mime_type=result["mime_type"],
            size_bytes=result["size_bytes"],
            uploaded_by_id=uploader_id,
        )
        db.add(attachment)

        # Also update the product record if it has an image_url column
        # (safe no-op if column doesn't exist yet)
        try:
            from app.models.product import Product
            product = db.query(Product).filter_by(id=product_id).first()
            if product and hasattr(product, "image_url"):
                product.image_url = result["public_url"]
        except Exception:
            pass

        db.commit()
        db.refresh(attachment)
        return jsonify({
            "message":    "Product image uploaded successfully.",
            "public_url": result["public_url"],
            "attachment": attachment.to_dict(),
        }), 201
    except Exception as exc:
        db.rollback()
        logger.exception("DB save failed after product image upload: %s", exc)
        return jsonify({"error": "Upload succeeded but metadata could not be saved.", "detail": str(exc)}), 500
    finally:
        db.close()


# ---------------------------------------------------------------------------
# List attachments  GET /api/storage/documents/<reference_id>
# ---------------------------------------------------------------------------

@storage_bp.route("/documents/<reference_id>", methods=["GET"])
@jwt_required()
def list_attachments(reference_id: str):
    """Return all non-deleted attachments for a given reference_id."""
    role = _get_role()
    if role not in DOWNLOAD_ROLES:
        return jsonify({"error": "Forbidden"}), 403

    doc_type = request.args.get("document_type")
    db = SessionLocal()
    try:
        query = db.query(FileAttachment).filter_by(reference_id=reference_id, is_deleted=False)
        if doc_type:
            query = query.filter_by(document_type=doc_type)
        attachments = query.order_by(FileAttachment.created_at.desc()).all()
        return jsonify({"data": [a.to_dict() for a in attachments]}), 200
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Get signed URL  GET /api/storage/documents/<attachment_id>/signed-url
# ---------------------------------------------------------------------------

@storage_bp.route("/documents/<attachment_id>/signed-url", methods=["GET"])
@jwt_required()
def get_signed_url(attachment_id: str):
    """
    Generate and return a short-lived signed URL for a private file.
    The signed URL is valid for 1 hour.
    """
    guard = _check_supabase()
    if guard:
        return guard

    role = _get_role()
    if role not in DOWNLOAD_ROLES:
        return jsonify({"error": "Forbidden"}), 403

    db = SessionLocal()
    try:
        attachment = db.query(FileAttachment).filter_by(id=attachment_id, is_deleted=False).first()
        if not attachment:
            return jsonify({"error": "Attachment not found."}), 404
        if attachment.bucket == PUBLIC_BUCKET:
            return jsonify({"signed_url": attachment.public_url, "expires_in": None}), 200

        signed_url = SupabaseStorageService.get_signed_url(attachment.storage_path, SIGNED_URL_EXPIRY)
        return jsonify({
            "signed_url": signed_url,
            "expires_in": SIGNED_URL_EXPIRY,
            "attachment": attachment.to_dict(),
        }), 200
    except Exception as exc:
        logger.exception("Signed URL generation error: %s", exc)
        return jsonify({"error": "Could not generate signed URL.", "detail": str(exc)}), 500
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Download  GET /api/storage/documents/<attachment_id>/download
# ---------------------------------------------------------------------------

@storage_bp.route("/documents/<attachment_id>/download", methods=["GET"])
@jwt_required()
def download_file(attachment_id: str):
    """Stream the file bytes through the Flask backend (keeps bucket private)."""
    guard = _check_supabase()
    if guard:
        return guard

    role = _get_role()
    if role not in DOWNLOAD_ROLES:
        return jsonify({"error": "Forbidden"}), 403

    db = SessionLocal()
    try:
        attachment = db.query(FileAttachment).filter_by(id=attachment_id, is_deleted=False).first()
        if not attachment:
            return jsonify({"error": "Attachment not found."}), 404

        file_bytes = SupabaseStorageService.download_file(attachment.storage_path, attachment.bucket)
        return send_file(
            io.BytesIO(file_bytes),
            mimetype=attachment.mime_type,
            as_attachment=True,
            download_name=attachment.original_name,
        )
    except Exception as exc:
        logger.exception("Download error: %s", exc)
        return jsonify({"error": "Could not download file.", "detail": str(exc)}), 500
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Delete  DELETE /api/storage/documents/<attachment_id>
# ---------------------------------------------------------------------------

@storage_bp.route("/documents/<attachment_id>", methods=["DELETE"])
@jwt_required()
def delete_attachment(attachment_id: str):
    """Soft-delete metadata and hard-delete the file from Supabase Storage."""
    guard = _check_supabase()
    if guard:
        return guard

    role = _get_role()
    if role not in DELETE_ROLES:
        return jsonify({"error": "Forbidden", "message": "Only ADMIN role may delete attachments."}), 403

    db = SessionLocal()
    try:
        attachment = db.query(FileAttachment).filter_by(id=attachment_id, is_deleted=False).first()
        if not attachment:
            return jsonify({"error": "Attachment not found."}), 404

        try:
            SupabaseStorageService.delete_file(attachment.storage_path, attachment.bucket)
        except Exception as exc:
            logger.warning("Storage deletion failed (continuing with soft-delete): %s", exc)

        attachment.is_deleted = True
        db.commit()
        return jsonify({"message": "Attachment deleted successfully."}), 200
    except Exception as exc:
        db.rollback()
        logger.exception("Delete error: %s", exc)
        return jsonify({"error": "Delete failed.", "detail": str(exc)}), 500
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Product image public URL  GET /api/storage/product-images/<product_id>
# ---------------------------------------------------------------------------

@storage_bp.route("/product-images/<product_id>", methods=["GET"])
def get_product_image(product_id: str):
    """Return the current public image URL for a product (no auth required — it's public)."""
    db = SessionLocal()
    try:
        attachment = (
            db.query(FileAttachment)
            .filter_by(reference_id=product_id, document_type="product_image", is_deleted=False)
            .order_by(FileAttachment.created_at.desc())
            .first()
        )
        if not attachment:
            return jsonify({"public_url": None}), 200
        return jsonify({"public_url": attachment.public_url}), 200
    finally:
        db.close()
