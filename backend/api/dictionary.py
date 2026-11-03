from flask import jsonify, request
from api import api_bp
from services.dictionary import lookup_word


@api_bp.route("/dictionary", methods=["GET"])
def search_dictionary():
    """
    GET /api/dictionary?q=word&from=auto
    Automatically detects language (English, Burmese, Japanese).
    Checks curated database first, falls back to AI/online translation.
    Does not add unverified words to the database.
    """
    query = request.args.get("q", "").strip()
    source_lang = request.args.get("from", "auto").strip().lower()

    if not query:
        return jsonify({"error": "Missing query parameter 'q'"}), 400

    if source_lang not in ("auto", "en", "my", "ja"):
        source_lang = "auto"

    result = lookup_word(query=query, source_lang=source_lang)
    if not result:
        return jsonify({"error": "Translation could not be found."}), 404

    return jsonify(result)
