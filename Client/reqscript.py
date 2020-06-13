import requests
import os.path
import sys
import json

url="https://ipv4.ip.nf/me.json"

r = requests.get(url)

def log_write(log_msg):
    if not os.path.isdir('../logs'):
        os.mkdir('../logs')
    with open("/".join(["..", "logs", sys.argv[0].replace("py", "txt")]), 'a') as file:
        file.write(log_msg)
		

if r.status_code != 200:
    log_write("Error: " + r.status_code)

if(r.headers['Content-Type'] == 'application/json'):
    data = r.json()
    log_write(json.dumps(data['ip']))
else:
    log_write('Response format is not JSON')