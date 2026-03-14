import os
import sys
from PIL import Image

def slice_spritesheet_smart(image_path, out_dir, names, axis="x"):
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    
    alpha = img.split()[-1]
    pixels = alpha.load()
    
    threshold = 5 # alpha > 5 is considered opaque
    
    # Step 1: Find gaps on the primary axis to isolate cells
    active_lines = []
    
    if axis == "x":
        for x in range(width):
            active = False
            for y in range(height):
                if pixels[x, y] > threshold:
                    active = True
                    break
            active_lines.append(active)
    else: # y axis
        for y in range(height):
            active = False
            for x in range(width):
                if pixels[x, y] > threshold:
                    active = True
                    break
            active_lines.append(active)
            
    blocks = []
    in_block = False
    start = 0
    for i, active in enumerate(active_lines):
        if active and not in_block:
            in_block = True
            start = i
        elif not active and in_block:
            in_block = False
            blocks.append((start, i))
            
    if in_block:
        if axis == "x":
            blocks.append((start, width))
        else:
            blocks.append((start, height))
            
    print(f"Found {len(blocks)} blocks on axis {axis}.")
    
    if len(blocks) != len(names):
        print(f"WARNING: Expected {len(names)} segments but found {len(blocks)}. Smart crop might have merged or split characters. Falling back to even grid based on {len(names)} segments...")
        blocks = []
        if axis == "x":
            cell_w = width // len(names)
            for i in range(len(names)):
                blocks.append((i * cell_w, (i + 1) * cell_w))
        else:
            cell_h = height // len(names)
            for i in range(len(names)):
                blocks.append((i * cell_h, (i + 1) * cell_h))
    
    os.makedirs(out_dir, exist_ok=True)
    
    for i, (start_val, end_val) in enumerate(blocks):
        if i >= len(names): break
        
        pad = 5
        start_val = max(0, start_val - pad)
        if axis == "x":
            end_val = min(width, end_val + pad)
            box = (start_val, 0, end_val, height)
        else:
            end_val = min(height, end_val + pad)
            box = (0, start_val, width, end_val)
            
        cell = img.crop(box)
        bbox = cell.getbbox()
        if bbox:
            cell = cell.crop(bbox)
            
        out_path = os.path.join(out_dir, f"{names[i]}.png")
        cell.save(out_path, "PNG")
        print(f"Saved correctly cropped cell to: {out_path}")

print("Processing Character Turnaround reference sheet (1x4, splitting by X axis)...")
sheet_1x4 = r"C:\Users\manhquy\.gemini\antigravity\brain\322e101a-a0bd-4ed7-bac9-cac00925a9f3\kisu_character_turnaround_1773414342127.png"
names_1x4 = [
    "kisu-ref-01-front",
    "kisu-ref-02-back",
    "kisu-ref-03-left",
    "kisu-ref-04-right"
]
slice_spritesheet_smart(sheet_1x4, r"d:\project\cungcontuhoc\public\kisu-assets\reference", names_1x4, axis="x")

print("Processing 3x3 Sticker Sheet by combining X and Y axis logic (falling back to grid if needed)...")
# For a 3x3 grid, a simple smart slice is hard to do perfectly if rows and columns overlap. We can do an even grid first, then apply `getbbox()` to each cell to tightly crop them, making sure it doesn't cross the mathematical line. However, the user issue was that the character crossed the mathematical line. Let's do a more robust approach for 3x3: Even grid + buffer + getbbox.
def split_grid_smart(image_path, out_dir, names, cols, rows):
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    cell_w = width // cols
    cell_h = height // rows
    
    os.makedirs(out_dir, exist_ok=True)
    
    idx = 0
    for r in range(rows):
        for c in range(cols):
            x1 = c * cell_w
            y1 = r * cell_h
            x2 = (c + 1) * cell_w
            y2 = (r + 1) * cell_h
            
            # Since the character might overlap the strict mathematical boundary, we can expand the box slightly by X% and then crop to transparent bounds. But we must be careful not to grab adjacent characters. Let's add a 10% overlap margin to grab the whole character.
            overlap_x = int(cell_w * 0.15)
            overlap_y = int(cell_h * 0.15)
            
            box_x1 = max(0, x1 - overlap_x)
            box_y1 = max(0, y1 - overlap_y)
            box_x2 = min(width, x2 + overlap_x)
            box_y2 = min(height, y2 + overlap_y)
            
            box = (box_x1, box_y1, box_x2, box_y2)
            cell = img.crop(box)
            
            # Find the largest connected component of alpha in this cell to isolate the main character from adjacent bleed-over.
            # However, `getbbox` is usually sufficient if the adjacent artifacts are small, but if there's significant overlap, it's safer to just do a strict crop without overlap and just warn the user. Let's try crop with `getbbox()` first.
            bbox = cell.getbbox()
            if bbox:
                cell = cell.crop(bbox)
                
            name = names[idx]
            out_path = os.path.join(out_dir, f"{name}.png")
            cell.save(out_path, "PNG")
            print(f"Saved: {out_path}")
            idx += 1

sheet_3x3 = r"C:\Users\manhquy\.gemini\antigravity\brain\322e101a-a0bd-4ed7-bac9-cac00925a9f3\kisu_sticker_sheet_3x3_1773414325084.png"
names_3x3 = [
    "kisu-act-01-wave",
    "kisu-act-02-read",
    "kisu-act-07-sleep",
    "kisu-ui-05-success",
    "kisu-exp-03-thinking",
    "kisu-exp-08-wink",
    "kisu-exp-06-sad",
    "kisu-exp-04-eureka",
    "kisu-act-05-run"
]
split_grid_smart(sheet_3x3, r"d:\project\cungcontuhoc\public\kisu-assets\stickers", names_3x3, 3, 3)

print("All done!")
