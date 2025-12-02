# one_drive_link.py
import os, time, json, requests
from typing import Dict, List

GRAPH_BASE = "https://graph.microsoft.com/v1.0"
TENANT_ID = os.getenv("MS_GRAPH_TENANT_ID")
CLIENT_ID = os.getenv("MS_GRAPH_CLIENT_ID")
CLIENT_SECRET = os.getenv("MS_GRAPH_CLIENT_SECRET")
SCOPE = "https://graph.microsoft.com/.default"

# Map categories to drive+folder IDs (env vars or a JSON blob)
CATEGORY_CONFIG = json.loads(os.getenv("ONEDRIVE_CATEGORY_JSON", "{}")) or {
    "EJU Past Problems": {
        "drive_id": os.getenv("ONEDRIVE_EJU_DRIVE_ID"),
        "folder_id": os.getenv("ONEDRIVE_EJU_FOLDER_ID"),
    },
    "Past Problems of J-Universites": {
        "drive_id": os.getenv("ONEDRIVE_JUNI_DRIVE_ID"),
        "folder_id": os.getenv("ONEDRIVE_JUNI_FOLDER_ID"),
    }
}

_token_cache = {"access_token": None, "expires_at": 0}

def _credentials_ready():
    return all([TENANT_ID, CLIENT_ID, CLIENT_SECRET])

def _get_token():
    if not _credentials_ready():
        return None
    now = time.time()
    if _token_cache["access_token"] and now < _token_cache["expires_at"]:
        return _token_cache["access_token"]
    resp = requests.post(
        f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token",
        data={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "grant_type": "client_credentials",
            "scope": SCOPE
        },
        timeout=15
    )
    resp.raise_for_status()
    data = resp.json()
    _token_cache["access_token"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 3599) - 60
    return _token_cache["access_token"]

def _headers():
    token = _get_token()
    if not token:
        return {}
    return {"Authorization": f"Bearer {token}"}

def _error_category(name, msg):
    return {
        "category": name,
        "files": [{
            "name": msg,
            "link_id": "error",
            "drive_id": None,
            "provider": "onedrive"
        }]
    }

def get_onedrive_files(category: str, drive_id: str, folder_id: str):
    if not drive_id or not folder_id:
        return _error_category(category, "Missing drive/folder IDs")
    if not _credentials_ready():
        return _error_category(category, "Missing Graph credentials")
    url = f"{GRAPH_BASE}/drives/{drive_id}/items/{folder_id}/children?$top=200"
    try:
        r = requests.get(url, headers=_headers(), timeout=20)
        r.raise_for_status()
        items = r.json().get("value", [])
    except Exception as exc:
        return _error_category(category, f"Graph error: {exc}")

    files = []
    for item in items:
        if "file" not in item:
            continue
        files.append({
            "name": item.get("name"),
            "link_id": item.get("id"),
            "drive_id": drive_id,
            "provider": "onedrive"
        })
    return {
        "category": category,
        "files": sorted(files, key=lambda f: f["name"])
    }

def download_drive_item(drive_id: str, item_id: str):
    if not (drive_id and item_id):
        raise ValueError("drive_id and item_id required")
    if not _credentials_ready():
        raise RuntimeError("Missing Graph credentials")
    url = f"{GRAPH_BASE}/drives/{drive_id}/items/{item_id}/content"
    r = requests.get(url, headers=_headers(), timeout=30)
    r.raise_for_status()
    return r.content

def collect_link_lists():
    categorized = {}
    all_lists = []
    for cat, cfg in CATEGORY_CONFIG.items():
        listing = get_onedrive_files(cat, cfg.get("drive_id"), cfg.get("folder_id"))
        categorized[cat] = listing
        all_lists.append(listing)
    return all_lists, categorized

# Lazy-load cache
_categorized_links_cache = None
_all_link_lists_cache = None
_last_refresh = 0  # epoch seconds

def get_categorized_links():
    global _categorized_links_cache, _all_link_lists_cache, _last_refresh
    if _categorized_links_cache is None:
        _all_link_lists_cache, _categorized_links_cache = collect_link_lists()
        _last_refresh = time.time()
    return _categorized_links_cache

def get_all_link_lists():
    # optional if you use the list version elsewhere
    global _categorized_links_cache, _all_link_lists_cache, _last_refresh
    if _all_link_lists_cache is None:
        _all_link_lists_cache, _categorized_links_cache = collect_link_lists()
        _last_refresh = time.time()
    return _all_link_lists_cache

#Optionally add TTL, lock, and soft-fail logic later.

