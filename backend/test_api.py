import requests

BASE_URL = "http://localhost:8000/api"

print("Testing Registration...")
user_data = {
    "email": "testuser_mongo@example.com",
    "name": "Test User Mongo",
    "role": "user"
}
response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
if response.status_code in [200, 201]:
    user = response.json()
    print("User registered successfully:", user)
    
    print("\nTesting Fetch User...")
    fetch_resp = requests.get(f"{BASE_URL}/users/{user['id']}")
    print("Fetch user response:", fetch_resp.json())
else:
    print("Registration failed:", response.status_code, response.text)
