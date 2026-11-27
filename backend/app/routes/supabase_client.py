import os
import logging
from flask import Blueprint, jsonify
from supabase import create_client, Client

logger = logging.getLogger(__name__)

supabase_bp = Blueprint('supabase', __name__, url_prefix='/api/supabase')

_supabase_client = None

def get_supabase_instance() -> Client:
    global _supabase_client
    if _supabase_client is None:
        url = os.environ.get("SUPABASE_URL", "")
        key = (
            os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
            or os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")
            or os.environ.get("SUPABASE_KEY", "")
        )
        if url and key:
            _supabase_client = create_client(url, key)
    return _supabase_client

@supabase_bp.route('/status', methods=['GET'])
def get_status():
    """Return live Supabase connection status."""
    url = os.environ.get("SUPABASE_URL", "")
    key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        or os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")
        or os.environ.get("SUPABASE_KEY", "")
    )
    if not url or not key:
        return jsonify({
            'connected': False,
            'url': None,
            'message': 'Supabase URL or Key not configured in .env'
        }), 200

    try:
        client = get_supabase_instance()
        key_type = 'publishable' if 'publishable' in key or key.startswith('sb_publishable') else 'service_role'
        return jsonify({
            'connected': True,
            'url': url,
            'key_type': key_type,
            'message': f'Connected to Supabase project at {url}',
            'status': 'active'
        }), 200
    except Exception as e:
        logger.error(f"Error checking Supabase status: {e}")
        return jsonify({
            'connected': False,
            'url': url,
            'error': str(e),
            'message': 'Failed to connect to Supabase'
        }), 500
