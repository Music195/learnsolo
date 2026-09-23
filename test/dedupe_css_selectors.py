#!/usr/bin/env python3
"""
dedupe_css_selectors.py

Compare the CSS selectors defined in a reference .css file against the
inline <style>...</style> blocks of a set of HTML files. Any rule inside
an HTML file's <style> block whose selector already appears in the
reference CSS file is deleted from that HTML file (the whole rule --
selector + declarations -- not just a property), on the assumption that
the reference stylesheet already provides that styling elsewhere.

Only SELECTORS are compared. Declarations/properties inside a rule are
never inspected, and a rule is removed purely because its selector text
duplicates one already in the reference file.

No third-party dependencies -- pure standard library.

Usage:
    python dedupe_css_selectors.py reference.css notes/ [--dry-run] [--backup]

Options:
    --dry-run   Report what would be removed without touching any file.
    --backup    Write a <file>.bak copy of each modified HTML file first.

Comparison granularity
----------------------
By default, a comma-separated selector list such as:
    h1, h2 { ... }
is treated as ONE selector string ("h1, h2") and only removed if that
exact combined selector also appears (as a whole) in the reference CSS.

If you'd rather treat each part of a comma list independently -- so that
a rule is dropped as soon as ANY one of its comma-separated selectors
duplicates a reference selector -- set SPLIT_COMMA_SELECTORS = True below.
"""

import argparse
import re
import sys
from pathlib import Path

SPLIT_COMMA_SELECTORS = True  # If True, treat each part of a comma-separated selector list independently


# --------------------------------------------------------------------------
# Minimal, dependency-free CSS structural parser.
#
# We don't need a full CSS parser: we only need to reliably find the
# boundaries between "selector { declarations }" blocks (including nested
# blocks such as @media { ... }), while ignoring braces/semicolons that
# appear inside comments or quoted strings. Everything else is kept as
# raw, untouched text so re-serializing produces a minimal diff.
# --------------------------------------------------------------------------

def _next_significant(css, i, end):
    """Return (index, char) of the next '{', '}' or ';' at or after i,
    skipping over /* comments */ and "..."/'...' string literals.
    Returns (end, None) if nothing more is found."""
    while i < end:
        c = css[i]
        if c == "/" and i + 1 < end and css[i + 1] == "*":
            j = css.find("*/", i + 2, end)
            i = (j + 2) if j != -1 else end
            continue
        if c in ("'", '"'):
            quote = c
            j = i + 1
            while j < end and css[j] != quote:
                if css[j] == "\\":
                    j += 2
                    continue
                j += 1
            i = j + 1
            continue
        if c in "{};":
            return i, c
        i += 1
    return end, None


def parse_blocks(css, pos=0, end=None):
    """Parse css[pos:end] into a list of nodes:
        ('text', raw_text)                    -- untouched text (whitespace,
                                                  comments, @import ...; etc.)
        ('rule', selector_text, content_text)  -- "selector { content }"
        ('atrule', prelude_text, nested_nodes) -- "@media (...) { rule* }"
    """
    if end is None:
        end = len(css)
    nodes = []
    buf_start = pos
    i = pos
    while i < end:
        idx, ch = _next_significant(css, i, end)
        if ch is None:
            break
        if ch == "{":
            selector = css[buf_start:idx]
            depth = 1
            j = idx + 1
            while depth > 0:
                jdx, jch = _next_significant(css, j, end)
                if jch is None:
                    j = end
                    break
                if jch == "{":
                    depth += 1
                elif jch == "}":
                    depth -= 1
                j = jdx + 1
            content = css[idx + 1:max(j - 1, idx + 1)]
            if selector.strip().startswith("@"):
                nested = parse_blocks(content, 0, len(content))
                nodes.append(("atrule", selector, nested))
            else:
                nodes.append(("rule", selector, content))
            i = j
            buf_start = i
        elif ch == ";":
            nodes.append(("text", css[buf_start:idx + 1]))
            i = idx + 1
            buf_start = i
        else:
            i = idx + 1
    if buf_start < end:
        nodes.append(("text", css[buf_start:end]))
    return nodes


def _strip_comments(s):
    return re.sub(r"/\*.*?\*/", "", s, flags=re.S)


def normalize_selector(sel):
    sel = _strip_comments(sel)
    sel = re.sub(r"\s+", " ", sel.strip())
    parts = [re.sub(r"\s+", " ", p.strip()) for p in sel.split(",") if p.strip() != ""]
    return ", ".join(parts)


def selector_keys(sel):
    norm = normalize_selector(sel)
    if not norm:
        return set()
    if SPLIT_COMMA_SELECTORS:
        return {p.strip() for p in norm.split(",")}
    return {norm}


def collect_selectors(nodes, keys):
    for node in nodes:
        if node[0] == "rule":
            keys |= selector_keys(node[1])
        elif node[0] == "atrule":
            collect_selectors(node[2], keys)


def rebuild(nodes, reference_keys, stats):
    parts = []
    for node in nodes:
        kind = node[0]
        if kind == "text":
            parts.append(node[1])
        elif kind == "rule":
            _, selector, content = node
            if selector_keys(selector) & reference_keys:
                stats["removed"] += 1
                stats["removed_selectors"].append(normalize_selector(selector))
                continue
            parts.append(selector + "{" + content + "}")
        elif kind == "atrule":
            _, selector, nested = node
            inner = rebuild(nested, reference_keys, stats)
            parts.append(selector + "{" + inner + "}")
    return "".join(parts)


STYLE_TAG_RE = re.compile(r"(<style\b[^>]*>)(.*?)(</style>)", re.DOTALL | re.IGNORECASE)


def load_reference_selectors(css_path):
    css_text = css_path.read_text(encoding="utf-8")
    nodes = parse_blocks(css_text)
    keys = set()
    collect_selectors(nodes, keys)
    return keys


def process_html_file(path, reference_keys, dry_run, backup):
    text = path.read_text(encoding="utf-8")
    file_stats = {"removed": 0, "removed_selectors": []}

    def replace(match):
        open_tag, css_text, close_tag = match.groups()
        nodes = parse_blocks(css_text)
        new_css = rebuild(nodes, reference_keys, file_stats)
        return open_tag + new_css + close_tag

    new_text = STYLE_TAG_RE.sub(replace, text)

    if file_stats["removed"] and not dry_run:
        if backup:
            path.with_suffix(path.suffix + ".bak").write_bytes(text.encode("utf-8"))
        path.write_text(new_text, encoding="utf-8")

    return file_stats


def main():
    parser = argparse.ArgumentParser(
        description="Remove <style> rules from HTML files whose selector duplicates one in a reference CSS file."
    )
    parser.add_argument("reference_css", type=Path, help="Reference .css file")
    parser.add_argument("root_dir", type=Path, help="Root directory to search recursively for .html files")
    parser.add_argument("--dry-run", action="store_true", help="Report only; don't modify any file")
    parser.add_argument("--backup", action="store_true", help="Write a .bak copy before modifying a file")
    args = parser.parse_args()

    if not args.reference_css.is_file():
        sys.exit(f"Reference CSS file not found: {args.reference_css}")
    if not args.root_dir.is_dir():
        sys.exit(f"Root directory not found: {args.root_dir}")

    reference_keys = load_reference_selectors(args.reference_css)
    print(f"Loaded {len(reference_keys)} selector(s) from {args.reference_css}")

    html_files = sorted(args.root_dir.rglob("*.html"))
    print(f"Found {len(html_files)} HTML file(s) under {args.root_dir}\n")

    total_removed = 0
    changed_files = 0
    for f in html_files:
        stats = process_html_file(f, reference_keys, args.dry_run, args.backup)
        if stats["removed"]:
            changed_files += 1
            total_removed += stats["removed"]
            tag = "[dry-run] " if args.dry_run else ""
            print(f"{tag}{f}: removed {stats['removed']} rule(s)")
            for sel in stats["removed_selectors"]:
                print(f"    - {sel}")

    print(
        f"\nDone. {total_removed} duplicate rule(s) removed across "
        f"{changed_files}/{len(html_files)} file(s)."
    )


if __name__ == "__main__":
    main()
