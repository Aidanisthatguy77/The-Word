#!/usr/bin/env bash
set -euo pipefail

APP_DIR=${APP_DIR:-/opt/the-word}
DOMAIN=${DOMAIN:-example.com}

sudo apt update
sudo apt install -y python3 python3-pip python3-venv ffmpeg curl

if ! command -v yt-dlp >/dev/null 2>&1; then
  sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
  sudo chmod a+rx /usr/local/bin/yt-dlp
fi

if ! command -v caddy >/dev/null 2>&1; then
  sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
  sudo apt update
  sudo apt install -y caddy
fi

sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"

python3 -m venv "$APP_DIR/.venv"
source "$APP_DIR/.venv/bin/activate"
pip install --upgrade pip
pip install -r "$APP_DIR/backend/requirements.txt"
pip install yt-dlp

sudo cp "$APP_DIR/deploy/the-word.service" /etc/systemd/system/the-word.service
sudo sed -i "s|/opt/the-word|$APP_DIR|g" /etc/systemd/system/the-word.service
sudo systemctl daemon-reload
sudo systemctl enable --now the-word

sudo cp "$APP_DIR/deploy/Caddyfile" /etc/caddy/Caddyfile
sudo sed -i "s/example.com/$DOMAIN/g" /etc/caddy/Caddyfile
sudo systemctl restart caddy

echo "Deployment complete: https://$DOMAIN"
