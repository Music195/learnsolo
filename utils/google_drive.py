import requests
from flask import request, Response, redirect

import google_drive_link as gdl

def get_links():
    return gdl.categorized_links

def fetch_pdf():
    url = request.args.get('url')

    if not url:
        return "No URL provided", 400

    if url.startswith('https://drive.google.com'):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                return Response(
                    response.content,
                    mimetype='application/pdf',
                    headers={'Content-Disposition': 'inline; filename=document.pdf'}
                )
            else:
                return f"Failed to fetch PDF: {response.status_code}", 400
        except Exception as e:
            return f"Error fetching PDF: {str(e)}", 500

    elif url.startswith('/static/'):
        return redirect(url)

    return "Invalid URL", 400
