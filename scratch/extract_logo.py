import os
from PIL import Image

def extract_logo(image_path, output_path):
    print(f"Loading image from {image_path}")
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    print(f"Image dimensions: {width}x{height}")
    
    # 1. Analyze row-by-row brightness to find the gap between logo symbol and text.
    # Convert to grayscale for easy analysis
    gray = img.convert("L")
    row_max_brightness = []
    for y in range(height):
        # find max brightness in this row
        max_val = 0
        for x in range(width):
            val = gray.getpixel((x, y))
            if val > max_val:
                max_val = val
        row_max_brightness.append(max_val)
        
    # We expect:
    # - A region of black space at the very top (optional)
    # - A region of active pixels (logo symbol)
    # - A region of black space (gap)
    # - A region of active pixels (text "VENIX WATCH")
    # - A region of black space at the bottom (optional)
    
    # Let's find rows that have max brightness > 20 (not background)
    active_rows = [y for y, val in enumerate(row_max_brightness) if val > 20]
    
    if not active_rows:
        print("Error: No active pixels found in the image.")
        return
        
    # Find gaps in active rows. A gap is a sequence of inactive rows.
    # We want to separate the first active cluster (logo) from the second active cluster (text).
    logo_start = active_rows[0]
    
    # Let's find the split point. Look for a gap of at least 15 consecutive inactive rows.
    split_y = None
    consec_inactive = 0
    in_logo = True
    
    for y in range(logo_start, height):
        if row_max_brightness[y] <= 20:
            consec_inactive += 1
        else:
            if consec_inactive > 15 and in_logo:
                # We found a gap of more than 15 rows, and then active pixels again (the text starts).
                # The end of the logo is y - consec_inactive
                logo_end = y - consec_inactive
                split_y = logo_end
                in_logo = False
                break
            consec_inactive = 0
            
    if split_y is None:
        # If no split point is found, assume the logo takes the top 70% of the active region
        logo_end = active_rows[-1]
        split_y = int(logo_start + (logo_end - logo_start) * 0.7)
        print(f"No clear gap found. Splitting at 70% of active range: y={split_y}")
    else:
        logo_end = split_y
        print(f"Found gap between logo symbol and text. Logo ends at y={logo_end}")
        
    # Crop the image to include only the logo symbol part (y from 0 to logo_end)
    logo_img = img.crop((0, 0, width, logo_end))
    
    # Crop horizontally to fit the logo symbol tight
    # Scan columns to find the left and right bounds of the logo symbol
    logo_gray = gray.crop((0, 0, width, logo_end))
    logo_active_cols = []
    for x in range(width):
        col_max = 0
        for y in range(logo_end):
            val = logo_gray.getpixel((x, y))
            if val > col_max:
                col_max = val
        if col_max > 20:
            logo_active_cols.append(x)
            
    if logo_active_cols:
        left_bound = max(0, logo_active_cols[0] - 10)
        right_bound = min(width, logo_active_cols[-1] + 10)
    else:
        left_bound = 0
        right_bound = width
        
    # Find top bound as well
    logo_active_rows = []
    for y in range(logo_end):
        row_max = 0
        for x in range(left_bound, right_bound):
            val = logo_gray.getpixel((x, y))
            if val > row_max:
                row_max = val
        if row_max > 20:
            logo_active_rows.append(y)
            
    if logo_active_rows:
        top_bound = max(0, logo_active_rows[0] - 10)
        bottom_bound = min(logo_end, logo_active_rows[-1] + 10)
    else:
        top_bound = 0
        bottom_bound = logo_end
        
    print(f"Bounding box for logo symbol: left={left_bound}, top={top_bound}, right={right_bound}, bottom={bottom_bound}")
    
    # Recrop to a balanced square around the emblem
    center_x = int((left_bound + right_bound) / 2)
    center_y = int((top_bound + bottom_bound) / 2)
    emblem_size = max(right_bound - left_bound, bottom_bound - top_bound)
    # Add about 15% padding
    square_size = int(emblem_size * 1.2)
    
    # Calculate crop coordinates, ensuring we stay within image bounds
    left = max(0, center_x - square_size // 2)
    right = min(width, left + square_size)
    top = max(0, center_y - square_size // 2)
    bottom = min(height, top + square_size)
    
    # Adjust in case we hit boundaries to keep it square
    actual_width = right - left
    actual_height = bottom - top
    final_size = min(actual_width, actual_height)
    
    right = left + final_size
    bottom = top + final_size
    
    print(f"Square crop bounds: left={left}, top={top}, right={right}, bottom={bottom}, size={final_size}x{final_size}")
    
    logo_cropped = img.crop((left, top, right, bottom))
    
    # Convert back to RGB to save as JPG / PNG with solid black background
    logo_rgb = logo_cropped.convert("RGB")
    logo_rgb.save(output_path, "PNG")
    print(f"Extracted logo with solid black background saved successfully to {output_path}")

if __name__ == "__main__":
    input_img = r"C:\Users\nguye\.gemini\antigravity-ide\brain\537afe14-82c6-4224-a520-3120f014c051\media__1780040602192.jpg"
    output_img = r"c:\laragon\www\venixwatch\frontend\src\assets\logo_icon.png"
    
    # Ensure assets directory exists
    os.makedirs(os.path.dirname(output_img), exist_ok=True)
    
    extract_logo(input_img, output_img)
