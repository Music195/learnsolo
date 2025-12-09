from flask import Blueprint, render_template
import utils.google_drive as gdl

problems_bp = Blueprint("problems", __name__)

@problems_bp.route("/note/kind_of_problem")
def kind_of_problem():
    categorized_links = gdl.get_links()
    return render_template("problems_list.html", categorized_links=categorized_links)

@problems_bp.route("/note/kind_of_problem/<path:category>")
def problem(category):
    categorized_links = gdl.get_links()
    if category not in categorized_links:
        return "<h1>Category not found</h1>", 404

    lists_of_link_dic = categorized_links[category]
    return render_template("problems_list.html",
                           lists_of_link_dic=lists_of_link_dic,
                           topic=category)
