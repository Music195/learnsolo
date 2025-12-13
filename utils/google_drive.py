import requests
from flask import request, Response, redirect
from urllib.parse import urlparse
import google_drive_link as gdl

def get_links(): 
    """
    Returns a dict:
    {
        category_name: {category, files},
        ...
    }
    """
    data = gdl.get_drive_links()

    return {
        item["category"]: item
        for item in data
    }

# Only allow these hosts
ALLOWED_HOSTS = {
    "drive.google.com",
    "docs.google.com",
}

# STEP 3: Security hardening (PDF proxy)
# ------------------------------------
# This endpoint is security-sensitive.
# Protections implemented:
# - HTTPS enforcement
# - hostname allowlist (SSRF protection)
# - request timeout
# - streaming response (memory safety)
#
# DO NOT loosen these checks without understanding
# the security implications.

def fetch_pdf():
    url = request.args.get("url")

    if not url:
        return "No URL provided", 400

    # Allow static files (safe local redirect)
    if url.startswith("/static/"):
        return redirect(url)

    # Parse URL safely
    parsed = urlparse(url)

    # Enforce HTTPS
    if parsed.scheme != "https":
        return "Only HTTPS URLs are allowed", 400

    # Enforce hostname allowlist
    if parsed.hostname not in ALLOWED_HOSTS:
        return "Host not allowed", 403

    try:
        # Stream PDF safely
        resp = requests.get(
            url,
            stream=True,
            timeout=10
        )

        if resp.status_code != 200:
            return f"Failed to fetch PDF ({resp.status_code})", 400

        return Response(
            resp.iter_content(chunk_size=8192),
            content_type="application/pdf",
            headers={
                "Content-Disposition": "inline; filename=document.pdf"
            }
        )

    except requests.exceptions.Timeout:
        return "PDF request timed out", 504
    except requests.exceptions.RequestException as e:
        return f"PDF fetch error: {e}", 502

