import urllib.request
import json
import urllib.error

# Step 1: Login to get token
login_url = 'https://venixwatchvn464.mbws.vn/backend/public/api/auth/login'
payload = {'email': 'admin@donghoatuan.vn', 'password': 'Admin@123456'}

req_login = urllib.request.Request(
    login_url, 
    data=json.dumps(payload).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req_login) as r:
        response_data = json.loads(r.read().decode('utf-8'))
        token = response_data['data']['token']
        print(f"Logged in successfully. Token: {token[:30]}...")
except Exception as e:
    print(f"Login failed: {e}")
    exit(1)

# Step 2: Query stats endpoint with Bearer token
stats_url = 'https://venixwatchvn464.mbws.vn/backend/public/api/admin/dashboard/stats'
req_stats = urllib.request.Request(
    stats_url,
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
)

try:
    with urllib.request.urlopen(req_stats) as r:
        print(f"Stats Status: {r.getcode()}")
        print(f"Stats Response: {r.read().decode('utf-8')[:200]}")
except urllib.error.HTTPError as e:
    print(f"Stats Error Status: {e.code}")
    print(f"Stats Error Response: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Stats Error: {e}")
