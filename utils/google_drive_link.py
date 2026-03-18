import os, json, time
from googleapiclient.discovery import build
from google.oauth2 import service_account

# ---------------------------
# Module-level cache
# ---------------------------
_drive_cache = None    #stores Drive data
_cache_time = 0        # when it was fetched
CACHE_TTL = 600        # time to live in s


def _build_credentials():
    """Create Google credentials safely"""
    if 'GOOGLE_CREDENTIALS_JSON' in os.environ:
        credentials_info = json.loads(os.environ['GOOGLE_CREDENTIALS_JSON'])
        return service_account.Credentials.from_service_account_info(
            credentials_info,
            scopes=['https://www.googleapis.com/auth/drive.readonly']
        )

    SERVICE_ACCOUNT_FILE = './math-problems-468009-2dfd02b27bfc.json'
    if os.path.exists(SERVICE_ACCOUNT_FILE):
        return service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE,
            scopes=['https://www.googleapis.com/auth/drive.readonly']
        )

    return None

"""Fetch files from one Drive folder"""
def _fetch_drive_folder(folder_id, category_name):
    try:
        credentials = _build_credentials()
        if not credentials:
            return {
                'category': category_name,
                'files': [{'name': 'No credentials available', 'link_id': 'dummy'}]
            }

        service = build('drive', 'v3', credentials=credentials)
        query = f"'{folder_id}' in parents and trashed=false"

        results = service.files().list(
            q=query,
            fields="files(id, name)"
        ).execute()

        files = results.get('files', [])
        return {
            'category': category_name,
            'files': [{'name': f['name'], 'link_id': f['id']} for f in files]
        }

    except Exception as e:
        return {
            'category': category_name,
            'files': [{'name': f'Error: {e}', 'link_id': 'error'}]
        }



def get_drive_links():
    """
    Public API:
    Fetch all Google Drive links lazily and cache them.
    """
    global _drive_cache,_cache_time
    
    current_time = time.time()

    if (_drive_cache is not None and current_time - _cache_time < CACHE_TTL):
        return _drive_cache

    past_problems_juni_id = "1kwIwb28AJo2-MhuE9V4pzcDxwXimIUxr"
    eju_folder_id = "1ZJ6zQFpYhtKarExGgMN4nyWH2UTT7cvl"

    data = [
        _fetch_drive_folder(eju_folder_id, "EJU Past Question"),
        _fetch_drive_folder(past_problems_juni_id, "Past Questions of J-Universities"),
    ]
    _drive_cache = data
    _cache_time = current_time
    

    return data

def refresh_drive_cache():
    global _drive_cache, _cache_time
    _drive_cache = None
    _cache_time = 0
