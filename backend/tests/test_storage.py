import pytest
import os
from unittest.mock import MagicMock, patch
from app import create_app
from app.services.storage_service import (
    validate_file,
    _safe_storage_path,
    SupabaseStorageService,
    PRIVATE_BUCKET,
    PUBLIC_BUCKET,
)

def test_file_validation_allowed_and_disallowed():
    # PDF for invoice is allowed
    valid_pdf = b"%PDF-1.4 test content..."
    is_valid, mime, err = validate_file(valid_pdf, "bill.pdf", "invoice")
    assert is_valid is True
    assert mime == "application/pdf"
    assert err == ""

    # Disallowed executable script for invoice
    exe_content = b"MZ999 fake exe"
    is_valid, mime, err = validate_file(exe_content, "malicious.exe", "invoice")
    assert is_valid is False
    assert "not allowed" in err

    # Large file rejection (>20MB)
    huge_bytes = b"0" * (21 * 1024 * 1024)
    is_valid, mime, err = validate_file(huge_bytes, "large.pdf", "invoice")
    assert is_valid is False
    assert "exceeds the maximum" in err

def test_safe_storage_path_sanitization():
    path = _safe_storage_path("invoice", "rec-1234", "application/pdf", "../../../etc/passwd;test.pdf")
    assert path.startswith("invoice/rec-1234/")
    assert path.endswith(".pdf")
    assert ".." not in path
    assert "/" not in path.split("/")[-1]

@patch("app.services.storage_service.get_supabase_client")
def test_supabase_upload_and_signed_url_mocked(mock_get_client):
    mock_storage = MagicMock()
    mock_bucket = MagicMock()
    mock_storage.from_.return_value = mock_bucket
    mock_client = MagicMock()
    mock_client.storage = mock_storage
    mock_get_client.return_value = mock_client

    # Test upload private document
    mock_bucket.upload.return_value = {"Key": "test"}
    res = SupabaseStorageService.upload_private_document(
        file_bytes=b"%PDF-test",
        original_filename="receipt.pdf",
        document_type="payment_receipt",
        reference_id="pay-999"
    )
    assert res["bucket"] == PRIVATE_BUCKET
    assert res["public_url"] is None
    assert "payment_receipt/pay-999/" in res["storage_path"]

    # Test signed url generation
    mock_bucket.create_signed_url.return_value = {"signedURL": "https://supabase.co/storage/v1/object/sign/erp-documents/test.pdf?token=123"}
    signed_url = SupabaseStorageService.get_signed_url(res["storage_path"])
    assert "token=123" in signed_url

    # Test upload public product image
    mock_bucket.get_public_url.return_value = "https://supabase.co/storage/v1/object/public/erp-product-images/prod.jpg"
    img_res = SupabaseStorageService.upload_product_image(
        file_bytes=b"\xFF\xD8\xFF image data",
        original_filename="snack.jpg",
        product_id="prod-001"
    )
    assert img_res["bucket"] == PUBLIC_BUCKET
    assert img_res["public_url"] == "https://supabase.co/storage/v1/object/public/erp-product-images/prod.jpg"

def test_storage_api_status_endpoint():
    app = create_app()
    client = app.test_client()
    
    # Login as admin
    login_res = client.post('/api/auth/login', json={'email': 'admin@demo.com', 'password': 'DemoPassword123!'})
    token = login_res.get_json().get('access_token') or login_res.get_json().get('token')
    
    status_res = client.get('/api/storage/status', headers={'Authorization': f'Bearer {token}'})
    assert status_res.status_code == 200
    data = status_res.get_json()
    assert "configured" in data
    assert data["private_bucket"] == "erp-documents"
    assert data["public_bucket"] == "erp-product-images"
