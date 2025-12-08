import os
from pathlib import Path

def fix_css_paths():
    """Fix CSS path from /style/ to /static/ in all HTML files"""
    notes_folder = Path("notes")
    html_files = list(notes_folder.rglob("*.html"))
    
    total = len(html_files)
    success_count = 0
    
    print(f"Found {total} HTML files to fix...")
    
    for i, file_path in enumerate(html_files, 1):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace /style/ with /static/
            if '/style/notes_style.css' in content:
                updated_content = content.replace('/style/notes_style.css', '/static/notes_style.css')
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
                
                print(f"Fixed [{i}/{total}]: {file_path.name}")
                success_count += 1
            else:
                print(f"Skipped [{i}/{total}]: {file_path.name} (already correct)")
        except Exception as e:
            print(f"Error fixing {file_path}: {e}")
    
    print(f"\n✓ Successfully fixed {success_count}/{total} files")

if __name__ == "__main__":
    fix_css_paths()
