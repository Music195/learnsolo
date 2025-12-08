import os
import re
from pathlib import Path

root_dirs = [Path('templates/notes'), Path('notes')]

print("=== Adding Proper Spaces to Files and Folders ===\n")

renamed_files = 0
renamed_folders = 0

def add_spaces_to_camelcase(text):
    """Add spaces before capital letters in CamelCase text"""
    # Replace underscores with spaces first
    text = re.sub(r'_', ' ', text)
    
    # Fix common word boundaries - before or after capital/space
    text = re.sub(r'(?<=[a-z])of(?=\s|[A-Z])', ' of', text)
    text = re.sub(r'(?<=[a-z])with(?=\s|[A-Z])', ' with', text)
    text = re.sub(r'(?<=[a-z])and(?=\s|[A-Z])', ' and', text)
    
    # Add space before capital letters (except at start and after spaces)
    text = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', text)
    
    # Fix spacing issues
    text = re.sub(r'\(\s*', ' (', text)  # Space before (
    text = re.sub(r'\s*\)', ')', text)   # No space before )
    text = re.sub(r'\)\s*(?=[a-zA-Z])', ') ', text)  # Space after ) if followed by letter
    text = re.sub(r'&\s*', ' & ', text)  # Space around &
    
    text = re.sub(r'\s+', ' ', text)     # Remove multiple spaces
    text = text.replace(' - ', '-')
    text = text.replace('° −', '°−')
    text = text.strip()
    return text

def fix_title_capitalization(text):
    """Fix capitalization in titles - lowercase 'of', 'and', 'with' except at start"""
    # Fix 'Of' to 'of' when not at start
    text = re.sub(r'(?<!^)\sOf\s', ' of ', text)
    text = re.sub(r'(?<!^)\sAnd\s', ' and ', text)
    text = re.sub(r'(?<!^)\sOf\b', ' of ', text)
    
    # Fix "Of90" or "Of180" pattern (missing space, should be "of 90")
    text = re.sub(r'\sOf(\d)', r' of \1', text)
    
    # Capitalize each word except specific articles
    words = text.split()
    capitalized = []
    for i, word in enumerate(words):
        if i == 0:
            # Always capitalize first word
            if word[0].islower():
                capitalized.append(word.capitalize())
            else:
                capitalized.append(word)
        elif word.lower() in ['of', 'and', 'with']:
            # Keep these lowercase unless they're at start
            capitalized.append(word.lower())
        elif word[0].islower() and word.isalpha():
            # Capitalize words that are all lowercase
            capitalized.append(word.capitalize())
        else:
            capitalized.append(word)
    
    return ' '.join(capitalized)

def capitalize_folder_name(name):
    """Capitalize folder names properly"""
    # Fix typos first
    if 'diagran' in name.lower():
        name = name.replace('Diagran', 'Diagram').replace('diagran', 'Diagram')
    
    # Lowercase words that should be lowercase
    name = re.sub(r'\bAnd\b', 'and', name)
    name = re.sub(r'\bOf\b', 'of', name)
    
    # Special cases - single word folders
    if name.lower() == 'function':
        return 'Function'
    if name.lower() == 'limit':
        return 'Limit'
    if name.lower() == 'other':
        return 'Other'
    if name.lower() == 'probability':
        return 'Probability'
    if name.lower() == 'complex plane':
        return 'Complex Plane'
    if name.lower() == 'parabola':
        return 'Parabola'
    if name.lower() == 'space vector':
        return 'Space Vector'
    
    # Capitalize first letter of each word except 'and', 'of'
    words = name.split()
    capitalized = []
    for i, word in enumerate(words):
        if word.lower() in ['and', 'of'] and i > 0:
            capitalized.append(word.lower())
        elif word[0].islower():
            capitalized.append(word.capitalize())
        else:
            capitalized.append(word)
    
    return ' '.join(capitalized)

# First, rename all folders (from deepest to shallowest to avoid path issues)
for root_dir in root_dirs:
    if not root_dir.exists():
        continue
    all_dirs = sorted([d for d in root_dir.glob('**/*') if d.is_dir()], key=lambda x: len(str(x)), reverse=True)

    for folder in all_dirs:
        foldername = folder.name
        
        # Apply capitalization fixes first
        new_foldername = capitalize_folder_name(foldername)
        
        # Skip if already processed
        if new_foldername == foldername and ' ' in foldername and not any(c.islower() for c in foldername[0:1]):
            continue
        
        # Add spaces to CamelCase folder names if needed
        if new_foldername == foldername and any(c.isupper() for c in foldername):
            new_foldername = add_spaces_to_camelcase(foldername)
        
        if new_foldername != foldername:
            new_path = folder.parent / new_foldername
            try:
                folder.rename(new_path)
                renamed_folders += 1
                print(f"Folder Old: {foldername}")
                print(f"Folder New: {new_foldername}")
                print(f"✓ Renamed folder: {folder.relative_to(root_dir)}\n")
            except Exception as e:
                print(f"✗ Error renaming folder {foldername}: {e}\n")

# Then rename all HTML files
for root_dir in root_dirs:
    if not root_dir.exists():
        continue
    for html_file in root_dir.glob('**/*.html'):
        filename = html_file.name
        new_filename = filename
        
        # Pattern: "01.Something.html" or "1exponentRules.html" (no dot) or "9TriangleIncircleAreaFormula.html"
        match = re.match(r'^(\d{1,2})\.?\s*([^.]+)(\.html)$', filename)
        if match:
            prefix = match.group(1)
            title = match.group(2)
            extension = match.group(3)
            
            # Add leading zero if needed
            if len(prefix) == 1:  # Single digit like "1"
                prefix = f"0{prefix}"
            
            # Ensure prefix has dot
            if not prefix.endswith('.'):
                prefix = f"{prefix}."
            
            # Process title to add proper spacing
            spaced_title = add_spaces_to_camelcase(title)
            # Fix capitalization
            spaced_title = fix_title_capitalization(spaced_title)
            new_filename = f"{prefix} {spaced_title}{extension}"
            
            if new_filename != filename:
                new_path = html_file.parent / new_filename
                try:
                    html_file.rename(new_path)
                    renamed_files += 1
                    print(f"File Old: {filename}")
                    print(f"File New: {new_filename}")
                    print(f"✓ Renamed: {html_file.relative_to(root_dir)}\n")
                except Exception as e:
                    print(f"✗ Error renaming {filename}: {e}\n")

print(f"{'='*60}")
print(f"✓ Successfully renamed: {renamed_folders} folders, {renamed_files} files")
print(f"{'='*60}")