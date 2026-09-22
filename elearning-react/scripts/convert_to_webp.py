import os
from PIL import Image

def convert_images(base_dir):
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                filepath = os.path.join(root, file)
                webp_path = os.path.splitext(filepath)[0] + '.webp'
                try:
                    with Image.open(filepath) as img:
                        img.save(webp_path, 'webp', quality=85)
                    os.remove(filepath)
                    print(f"Converted and removed: {filepath}")
                except Exception as e:
                    print(f"Error converting {filepath}: {e}")

def update_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace('.jpg', '.webp').replace('.png', '.webp')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated references in: {filepath}")

def update_references(base_dir):
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith(('.jsx', '.js', '.css')):
                filepath = os.path.join(root, file)
                update_file(filepath)

if __name__ == "__main__":
    public_dir = r"c:\Code\ELearning\elearning-react\public"
    src_dir = r"c:\Code\ELearning\elearning-react\src"
    index_file = r"c:\Code\ELearning\elearning-react\index.html"
    
    print("Converting images in public directory...")
    convert_images(public_dir)
    
    print("Updating references in src directory...")
    update_references(src_dir)
    update_file(index_file)
