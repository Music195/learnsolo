import os
import re
from pathlib import Path

def update_html_files():
    """Update all HTML files in templates/notes to use unified CSS"""
    
    notes_dir = Path('templates/notes')
    css_link = '<link rel="stylesheet" href="/static/notes_style.css">'
    
    updated_count = 0
    error_count = 0
    
    # Find all HTML files
    html_files = list(notes_dir.glob('**/*.html'))
    
    print(f"Found {len(html_files)} HTML files to process...")
    
    for html_file in html_files:
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if already has the unified CSS
            if '/static/notes_style.css' in content:
                continue
            
            # Remove inline <style> tags and their content
            content = re.sub(r'<style[^>]*>.*?</style>', '', content, flags=re.DOTALL)
            
            # Remove any existing external stylesheet links (except MathJax)
            content = re.sub(r'<link[^>]*rel=["\']stylesheet["\'][^>]*>', '', content)
            
            # Add the new CSS link in the <head> section
            if '<head>' in content:
                content = content.replace('<head>', f'<head>\n    {css_link}')
            elif '<HEAD>' in content:
                content = content.replace('<HEAD>', f'<HEAD>\n    {css_link}')
            else:
                # If no <head> tag, add it after <!DOCTYPE> or at the beginning
                if '<!DOCTYPE' in content.upper():
                    lines = content.split('\n')
                    for i, line in enumerate(lines):
                        if '<!DOCTYPE' in line.upper() or '<html' in line.lower():
                            if i + 1 < len(lines):
                                lines.insert(i + 1, f'<head>\n    {css_link}\n</head>')
                                break
                    content = '\n'.join(lines)
            
            # Write back the updated content
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            updated_count += 1
            print(f"✓ Updated: {html_file.relative_to(notes_dir)}")
            
        except Exception as e:
            error_count += 1
            print(f"✗ Error processing {html_file.name}: {e}")
    
    print(f"\n{'='*60}")
    print(f"✓ Successfully updated: {updated_count} files")
    if error_count > 0:
        print(f"✗ Errors: {error_count} files")
    print(f"{'='*60}")

if __name__ == '__main__':
    update_html_files()
