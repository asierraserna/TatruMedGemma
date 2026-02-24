"""
Test script for the MedGemma Flask API
"""

import requests
import json
from PIL import Image
import io
import base64

# API endpoint
API_URL = "http://localhost:5000"

def test_health():
    """Test the health check endpoint"""
    print("Testing health endpoint...")
    response = requests.get(f"{API_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def test_analyze_with_file():
    """Test analysis with file upload"""
    print("Testing analyze endpoint with file upload...")
    
    # Download a test image
    image_url = "https://upload.wikimedia.org/wikipedia/commons/c/c8/Chest_Xray_PA_3-8-2010.png"
    response = requests.get(image_url, headers={"User-Agent": "test"})
    image = Image.open(io.BytesIO(response.content))
    
    # Save to temporary file
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    # Send to API
    files = {'image': ('xray.png', img_byte_arr, 'image/png')}
    data = {'prompt': 'Describe this X-ray in detail'}
    
    response = requests.post(f"{API_URL}/analyze", files=files, data=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def test_analyze_with_base64():
    """Test analysis with base64 encoded image"""
    print("Testing analyze endpoint with base64 image...")
    
    # Download a test image
    image_url = "https://upload.wikimedia.org/wikipedia/commons/c/c8/Chest_Xray_PA_3-8-2010.png"
    response = requests.get(image_url, headers={"User-Agent": "test"})
    image = Image.open(io.BytesIO(response.content))
    
    # Convert to base64
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    img_base64 = base64.b64encode(img_byte_arr.read()).decode('utf-8')
    
    # Send to API
    payload = {
        'image_base64': img_base64,
        'prompt': 'Describe this chest X-ray'
    }
    
    response = requests.post(
        f"{API_URL}/analyze", 
        json=payload,
        headers={'Content-Type': 'application/json'}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")


def test_analyze_stream():
    """Test the streaming endpoint and print chunks as they arrive"""
    print("Testing analyze_stream endpoint...")
    image_url = "https://upload.wikimedia.org/wikipedia/commons/c/c8/Chest_Xray_PA_3-8-2010.png"
    response = requests.get(image_url, headers={"User-Agent": "test"})
    image = Image.open(io.BytesIO(response.content))

    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)

    files = {'image': ('xray.png', img_byte_arr, 'image/png')}
    data = {'prompt': 'Describe this X-ray in detail'}

    with requests.post(f"{API_URL}/analyze_stream", files=files, data=data, stream=True) as resp:
        print(f"Status: {resp.status_code}")
        for chunk in resp.iter_content(chunk_size=None):
            try:
                text = chunk.decode('utf-8')
            except Exception:
                text = str(chunk)
            print(text, end='')
        print("\n")

if __name__ == "__main__":
    print("=" * 50)
    print("MedGemma API Test Script")
    print("=" * 50 + "\n")
    
    try:
        test_health()
        # Uncomment to test the analyze endpoints
        # test_analyze_with_file()
        # test_analyze_with_base64()
        # test_analyze_stream()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to API. Make sure the server is running on port 5000")
    except Exception as e:
        print(f"Error: {e}")
