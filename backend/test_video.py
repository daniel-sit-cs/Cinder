import requests
import base64
import os
import glob

# 1. Find the latest generated image
list_of_files = glob.glob('generated_images/*.png') 
if not list_of_files:
    print("❌ No images found! Run the app and generate a story first.")
    exit()

latest_file = max(list_of_files, key=os.path.getctime)
print(f"📸 Found image: {latest_file}")

# 2. Convert to Base64 (Simulating what the App does)
with open(latest_file, "rb") as image_file:
    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    base64_image = f"data:image/png;base64,{encoded_string}"

# 3. Send to Server
url = "http://localhost:8000/animate-frame"
payload = {"imageUrl": base64_image}

print("🚀 Sending to Hugging Face Video Engine (This takes ~30-60 seconds)...")
try:
    response = requests.post(url, json=payload, timeout=120)
    
    if response.status_code == 200:
        print("✅ SUCCESS!")
        print(response.json())
        print("📂 Check your 'generated_videos' folder now!")
    else:
        print(f"❌ Failed: {response.text}")

except Exception as e:
    print(f"❌ Error: {e}")