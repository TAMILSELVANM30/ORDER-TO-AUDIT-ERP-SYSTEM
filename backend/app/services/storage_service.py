"""
Supabase Storage Service
Handles all file operations with erp-documents (private) and erp-product-images (public) buckets.
Never exposes the SUPABASE_SERVICE_ROLE_KEY to the frontend.
"""
import os
import uuid
import mimetypes
import logging
from typing import Optional, Tuple
from supabase import create_client, Client

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants & configuration
# ---------------------------------------------------------------------------

PRIVATE_BUCKET = "erp-documents"
PUBLIC_BUCKET  = "erp-product-images"

# Allowed MIME types per document category
ALLOWED_MIME_TYPES = {
    "invoice":           {"application/pdf", "image/jpeg", "image/png", "image/webp"},
    "purchase_bill":     {"application/pdf", "image/jpeg", "image/png", "image/webp"},
    "payment_receipt":   {"application/pdf", "image/jpeg", "image/png", "image/webp"},
    "production_report": {"application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                          "text/csv", "image/jpeg", "image/png"},
    "dispatch_proof":    {"application/pdf", "image/jpeg", "image/png", "image/webp"},
    "audit_attachment":  {"application/pdf", "image/jpeg", "image/png", "image/webp",
                          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"},
    "product_image":     {"image/jpeg", "image/png", "image/webp", "image/gif"},
}

ALLOWED_EXTENSIONS = {
    "image/jpeg":    ".jpg",
    "image/png":     ".png",
    "image/webp":    ".webp",
    "image/gif":     ".gif",
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "text/csv":      ".csv",
}

# Max file sizes in bytes as specified for the buckets:
# erp-documents: 10 MB, erp-product-images: 5 MB
MAX_FILE_SIZES = {
    "product_image": 5  * 1024 * 1024,   # 5 MB (erp-product-images)
    "default":       10 * 1024 * 1024,   # 10 MB (erp-documents)
}

SIGNED_URL_EXPIRY = 3600  # 1 hour in seconds


# ---------------------------------------------------------------------------
# Supabase client (singleton, lazy init)
# ---------------------------------------------------------------------------

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Return (and cache) the Supabase admin client using the service role key."""
    global _supabase_client
    if _supabase_client is None:
        url = os.environ.get("SUPABASE_URL", "")
        key = (
            os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
            or os.environ.get("SUPABASE_KEY", "")
            or os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")
        )
        if not url or not key:
            raise EnvironmentError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment. "
                "Copy .env.example to .env and fill in your Supabase project credentials."
            )
        _supabase_client = create_client(url, key)
    return _supabase_client


def is_supabase_configured() -> bool:
    """Return True when Supabase env vars are present (does not validate credentials)."""
    return bool(
        os.environ.get("SUPABASE_URL")
        and (
            os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
            or os.environ.get("SUPABASE_KEY")
            or os.environ.get("SUPABASE_PUBLISHABLE_KEY")
        )
    )


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def _detect_mime(file_bytes: bytes, filename: str) -> str:
    """Detect MIME type from filename extension as a safe fallback."""
    mime, _ = mimetypes.guess_type(filename)
    return mime or "application/octet-stream"


def validate_file(file_bytes: bytes, filename: str, document_type: str) -> Tuple[bool, str, str]:
    """
    Validate file size, extension, and MIME type.

    Returns:
        (is_valid, mime_type, error_message)
    """
    mime = _detect_mime(file_bytes, filename)

    # MIME type check
    allowed = ALLOWED_MIME_TYPES.get(document_type, set())
    if mime not in allowed:
        return False, mime, (
            f"File type '{mime}' is not allowed for document type '{document_type}'. "
            f"Allowed types: {', '.join(sorted(allowed))}"
        )

    # Size check
    max_size = MAX_FILE_SIZES.get(document_type, MAX_FILE_SIZES["default"])
    if len(file_bytes) > max_size:
        return False, mime, (
            f"File size {len(file_bytes) // 1024} KB exceeds the maximum "
            f"allowed size of {max_size // 1024 // 1024} MB for type '{document_type}'."
        )

    return True, mime, ""


# ---------------------------------------------------------------------------
# Safe path generation (never trust user filenames)
# ---------------------------------------------------------------------------

def _safe_storage_path(document_type: str, reference_id: str, mime_type: str, original_name: str) -> str:
    """
    Generate a collision-resistant, safe storage path.
    Format: {document_type}/{reference_id}/{uuid}{ext}
    """
    ext = ALLOWED_EXTENSIONS.get(mime_type, ".bin")
    unique_id = uuid.uuid4().hex
    # Keep only alphanumeric chars from the original name as a hint (max 30 chars)
    safe_hint = "".join(c for c in os.path.splitext(original_name)[0] if c.isalnum() or c in "-_")[:30]
    filename = f"{safe_hint}_{unique_id}{ext}" if safe_hint else f"{unique_id}{ext}"
    return f"{document_type}/{reference_id}/{filename}"


# ---------------------------------------------------------------------------
# Core storage operations
# ---------------------------------------------------------------------------

class SupabaseStorageService:
    """
    Reusable service class for all Supabase Storage operations.
    Use class methods directly — no instantiation needed.
    """

    @classmethod
    def upload_private_document(
        cls,
        file_bytes: bytes,
        original_filename: str,
        document_type: str,
        reference_id: str,
    ) -> dict:
        """
        Upload a file to the private erp-documents bucket.

        Args:
            file_bytes:        Raw file bytes.
            original_filename: Original file name from the user (used only for MIME detection & hint).
            document_type:     Category key (invoice, purchase_bill, payment_receipt, …).
            reference_id:      Related DB record ID (invoice_id, purchase_id, …).

        Returns:
            dict with storage_path, public_url (None for private), bucket, mime_type, size_bytes.
        """
        is_valid, mime, err = validate_file(file_bytes, original_filename, document_type)
        if not is_valid:
            raise ValueError(err)

        storage_path = _safe_storage_path(document_type, reference_id, mime, original_filename)
        client = get_supabase_client()

        client.storage.from_(PRIVATE_BUCKET).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": mime, "upsert": "false"},
        )
        logger.info("Uploaded private document: %s → %s", original_filename, storage_path)

        return {
            "bucket":        PRIVATE_BUCKET,
            "storage_path":  storage_path,
            "public_url":    None,  # private bucket — never public
            "mime_type":     mime,
            "size_bytes":    len(file_bytes),
            "original_name": original_filename,
        }

    @classmethod
    def upload_product_image(
        cls,
        file_bytes: bytes,
        original_filename: str,
        product_id: str,
    ) -> dict:
        """
        Upload a product image to the public erp-product-images bucket.

        Returns:
            dict with storage_path, public_url, bucket, mime_type, size_bytes.
        """
        is_valid, mime, err = validate_file(file_bytes, original_filename, "product_image")
        if not is_valid:
            raise ValueError(err)

        storage_path = _safe_storage_path("products", product_id, mime, original_filename)
        client = get_supabase_client()

        client.storage.from_(PUBLIC_BUCKET).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": mime, "upsert": "true"},
        )

        # Build the public URL using Supabase's public URL helper
        url_response = client.storage.from_(PUBLIC_BUCKET).get_public_url(storage_path)
        public_url = url_response if isinstance(url_response, str) else str(url_response)

        logger.info("Uploaded product image: %s → %s (public: %s)", original_filename, storage_path, public_url)

        return {
            "bucket":        PUBLIC_BUCKET,
            "storage_path":  storage_path,
            "public_url":    public_url,
            "mime_type":     mime,
            "size_bytes":    len(file_bytes),
            "original_name": original_filename,
        }

    @classmethod
    def get_signed_url(cls, storage_path: str, expiry_seconds: int = SIGNED_URL_EXPIRY) -> str:
        """
        Generate a time-limited signed URL for a private document.
        Only the backend should call this — never expose to the React client directly
        without an authorization check.
        """
        client = get_supabase_client()
        response = client.storage.from_(PRIVATE_BUCKET).create_signed_url(
            path=storage_path,
            expires_in=expiry_seconds,
        )
        # SDK may return a dict or object; normalise to string URL
        if isinstance(response, dict):
            signed = response.get("signedURL") or response.get("signedUrl") or ""
        elif hasattr(response, "signed_url"):
            signed = response.signed_url
        else:
            signed = str(response)

        if not signed:
            raise RuntimeError(f"Could not generate signed URL for path: {storage_path}")
        return signed

    @classmethod
    def download_file(cls, storage_path: str, bucket: str = PRIVATE_BUCKET) -> bytes:
        """Download and return raw bytes for a stored file."""
        client = get_supabase_client()
        response = client.storage.from_(bucket).download(storage_path)
        return response

    @classmethod
    def delete_file(cls, storage_path: str, bucket: str = PRIVATE_BUCKET) -> bool:
        """
        Delete a file from storage.

        Returns:
            True if deletion succeeded.
        """
        client = get_supabase_client()
        client.storage.from_(bucket).remove([storage_path])
        logger.info("Deleted file: %s from bucket %s", storage_path, bucket)
        return True

    @classmethod
    def list_files(cls, folder: str, bucket: str = PRIVATE_BUCKET) -> list:
        """List files inside a folder path in the given bucket."""
        client = get_supabase_client()
        response = client.storage.from_(bucket).list(folder)
        return response or []
