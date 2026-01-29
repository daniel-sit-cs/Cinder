"""
Simple test script for Cinder Backend API
Run this after starting the server with run_mock.bat
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health endpoint"""
    print("Testing /health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()

def test_generate_story():
    """Test the story generation endpoint"""
    print("Testing /generate-story endpoint...")
    
    payload = {
        "userId": "test_user_123",
        "prompt": "A brave little mouse goes on a magical adventure in an enchanted forest",
        "style": "storybook",
        "frameCount": 4
    }
    
    print(f"Request: {json.dumps(payload, indent=2)}")
    print()
    
    response = requests.post(
        f"{BASE_URL}/generate-story",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response Status: {data['status']}")
        print(f"Story ID: {data['storyId']}")
        print(f"Number of frames: {len(data['frames'])}")
        print()
        
        for frame in data['frames']:
            print(f"Frame {frame['index']}:")
            print(f"  Narration: {frame['narration']}")
            print(f"  Image URL length: {len(frame['imageUrl'])} characters")
            print()
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    print("=" * 60)
    print("Cinder Backend API Test")
    print("=" * 60)
    print()
    
    try:
        test_health_check()
        test_generate_story()
        print("✓ All tests completed!")
    except requests.exceptions.ConnectionError:
        print("✗ Error: Could not connect to server.")
        print("Make sure the server is running with run_mock.bat")
    except Exception as e:
        print(f"✗ Error: {e}")
