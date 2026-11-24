import os
import uuid
import pytest
from unittest.mock import MagicMock, patch
from app import create_app
from app.services.storage_service import (
    SupabaseStorageService,
    is_supabase_configured,
    PRIVATE_BUCKET,
    PUBLIC_BUCKET,
    MAX_FILE_SIZES,
)

def test_configured_bucket_limits():
    """Verify bucket limits match requirements (erp-documents: 10MB, erp-product-images: 5MB)"""
    assert MAX_FILE_SIZES["default"] == 10 * 1024 * 1024
    assert MAX_FILE_SIZES["product_image"] == 5 * 1024 * 1024

def test_real_or_live_credential_upload_and_cleanup():
    """
    If real SUPABASE credentials exist in the environment, perform actual upload,
    signed URL generation, download, and immediate deletion to verify live buckets.
    Otherwise, gracefully skips live I/O and asserts mock behavior.
    """
    if is_supabase_configured():
        test_filename = f"test_health_probe_{uuid.uuid4().hex[:8]}.pdf"
        test_bytes = b"%PDF-1.4 test probe content for supabase storage"
        
        # 1. Test private upload
        res = SupabaseStorageService.upload_private_document(
            file_bytes=test_bytes,
            original_filename=test_filename,
            document_type="invoice",
            reference_id="health-probe-1"
        )
        assert res["bucket"] == PRIVATE_BUCKET
        storage_path = res["storage_path"]
        
        try:
            # 2. Test signed url
            signed_url = SupabaseStorageService.get_signed_url(storage_path)
            assert signed_url.startswith("http")
            
            # 3. Test download bytes
            downloaded = SupabaseStorageService.download_file(storage_path, PRIVATE_BUCKET)
            assert downloaded == test_bytes
        finally:
            # 4. Cleanup
            SupabaseStorageService.delete_file(storage_path, PRIVATE_BUCKET)
    else:
        # Mock mode when user hasn't yet entered keys into .env
        with patch("app.services.storage_service.get_supabase_client") as mock_get_client:
            mock_client = MagicMock()
            mock_bucket = MagicMock()
            mock_client.storage.from_.return_value = mock_bucket
            mock_get_client.return_value = mock_client
            
            res = SupabaseStorageService.upload_private_document(
                file_bytes=b"%PDF-1.4 mock",
                original_filename="mock.pdf",
                document_type="invoice",
                reference_id="mock-1"
            )
            assert res["bucket"] == PRIVATE_BUCKET
