import os
from rembg import remove
from PIL import Image

assets_dir = "d:/project/cungcontuhoc/public/assets/garden"
files = ["ground.png", "trunk.png", "cloud_platform.png"]

print("Starting background removal process...")
for file in files:
    input_path = os.path.join(assets_dir, file)
    output_path = os.path.join(assets_dir, file) # Overwrite
    
    if os.path.exists(input_path):
        print(f"Processing {file}...")
        try:
            input_image = Image.open(input_path)
            output_image = remove(input_image)
            output_image.save(output_path)
            print(f"Successfully removed background from {file}")
        except Exception as e:
            print(f"Error processing {file}: {e}")
    else:
        print(f"File not found: {input_path}")

print("Background removal complete.")
