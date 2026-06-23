steps i took to make BE server run constantly:

sudo nano /etc/systemd/system/fastapi.service

In the file:
[Unit]
Description=FastAPI Cauris Dashboard Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/Dashboard/backend
ExecStart=/home/ubuntu/Dashboard/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
EnvironmentFile=/home/ubuntu/Dashboard/backend/.env

[Install]
WantedBy=multi-user.target

Then:
sudo systemctl daemon-reload
sudo systemctl reset-failed fastapi
sudo systemctl start fastapi
sudo systemctl status fastapi

Should be enabled and running.
