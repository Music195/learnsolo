import os
import re
import json

NOTES_DIR = "notes"
OUTPUT_FILE = "tags.json"
TAG_PATTERN = re.compile(r"<!--\s*tags:\s*(.*?)\s*-->", re.IGNORECASE)

tags_data = {}

# Walk through all subfolders and .html files
for root, _, files in os.walk(NOTES_DIR):
    for file in files:
        if file.endswith(".html"):
            filepath = os.path.join(root, file)

            # Convert full path to relative path from notes folder (no .html)
            rel_path = os.path.relpath(filepath, NOTES_DIR).replace("\\", "/")
            note_key = rel_path[:-5]  # remove .html extension

            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            match = TAG_PATTERN.search(content)
            if match:
                tags = [tag.strip() for tag in match.group(1).split(",") if tag.strip()]
                tags_data[note_key] = tags

# Write tags.json
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(tags_data, f, indent=4)

print(f"✅ tags.json generated with {len(tags_data)} entries.")