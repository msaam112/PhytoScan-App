import os
from pathlib import Path

def print_folder_structure(startpath, max_depth=None, indent=0):
    # Skip these directories
    exclude = set(['node_modules', '.git', '.expo', '__pycache__'])
    
    for root, dirs, files in os.walk(startpath):
        # Apply max depth
        level = root.replace(startpath, '').count(os.sep)
        if max_depth and level > max_depth:
            continue
            
        # Filter excluded directories
        dirs[:] = [d for d in dirs if d not in exclude]
        
        # Print current directory
        indent_str = '│   ' * (level - 1) + '├── '
        print(f"{indent_str}{os.path.basename(root)}/")
        
        # Print files
        for f in files:
            file_indent = '│   ' * level + '├── '
            print(f"{file_indent}{f}")

if __name__ == "__main__":
    project_root = os.getcwd()  # Run this script in your project root
    print("\n📁 Project Structure:")
    print_folder_structure(project_root, max_depth=4)