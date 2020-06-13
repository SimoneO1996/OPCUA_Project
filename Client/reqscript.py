import requests
import os.path
import sys
import json

url="https://ipv4.ip.nf/me.json"

r = requests.get(url)
		
if r.status_code != 200:
    print("Error: " + r.status_code)

if(r.headers['Content-Type'] == 'application/json'):
    data = r.json()
    print(json.dumps(data['ip']))
else:
    print('Response format is not JSON')

while(True):
    print("sono vivo")