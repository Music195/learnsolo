import os

root_dir= 'notes'

print(" ===Dry Run: No files will be renamed ===\n")

for dirpath, dirnames, filenames in os.walk(root_dir):
    for filename in filenames:
        full_path = os.path.join(dirpath, filename)
        
        if filename and filename[0].isdigit() and filename[0] != '0':
            if len(filename) <2 or not filename[1].isdigit():
                new_name = '0' + filename
                new_path = os.path.join(dirpath, new_name)
                os.rename(full_path, new_path)
                print(f"Renamed: {full_path} -> {new_path}")