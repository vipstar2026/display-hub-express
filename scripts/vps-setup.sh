#!/usr/bin/env bash
# =====================================================================
# VPS Bootstrap Script — Ubuntu/Debian 22.04+
# تثبيت كل المتطلبات لتشغيل VIP Star (vipstar.cc) على VPS جديد
#
# الاستخدام السريع (افتراضات vipstar.cc جاهزة):
#   curl -fsSL https://raw.githubusercontent.com/vipstar2026/display-hub-express/main/scripts/vps-setup.sh | sudo bash
#
# أو مع قيم مخصصة:
#   sudo bash vps-setup.sh <domain> <email> [git-url]
# =====================================================================
set -euo pipefail

DOMAIN="${1:-vipstar.cc}"
EMAIL="${2:-pppahmed71@gmail.com}"
REPO_URL="${3:-https://github.com/vipstar2026/display-hub-express.git}"
APP_NAME="vipstar"
APP_USER="deploy"
APP_DIR="/home/${APP_USER}/${APP_NAME}"
APP_PORT="3000"

echo "🌐 Domain: ${DOMAIN}"
echo "📧 Email:  ${EMAIL}"
echo "📦 Repo:   ${REPO_URL}"
echo ""

echo "▶ 1/8 تحديث النظام..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y curl git build-essential ca-certificates ufw nginx certbot python3-certbot-nginx unzip

echo "▶ 2/8 إنشاء مستخدم النشر..."
if ! id "$APP_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$APP_USER"
  usermod -aG sudo "$APP_USER"
fi
mkdir -p /home/${APP_USER}/.ssh
chmod 700 /home/${APP_USER}/.ssh
[ -f /root/.ssh/authorized_keys ] && cp /root/.ssh/authorized_keys /home/${APP_USER}/.ssh/
chown -R ${APP_USER}:${APP_USER} /home/${APP_USER}/.ssh

echo "▶ 3/8 تثبيت Node.js 20 + Bun + PM2..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2

sudo -u ${APP_USER} bash -c 'curl -fsSL https://bun.sh/install | bash'
grep -q '.bun/bin' /home/${APP_USER}/.bashrc || \
  echo 'export PATH="$HOME/.bun/bin:$PATH"' >> /home/${APP_USER}/.bashrc

echo "▶ 4/8 إعداد جدار الحماية..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "▶ 5/8 استنساخ المشروع وبنائه..."
sudo -u ${APP_USER} bash <<EOF
  set -e
  export PATH="\$HOME/.bun/bin:\$PATH"
  if [ ! -d "${APP_DIR}/.git" ]; then
    rm -rf "${APP_DIR}"
    git clone ${REPO_URL} ${APP_DIR}
  else
    cd ${APP_DIR}
    git fetch --all
    git reset --hard origin/main
    git clean -fd
  fi
  cd ${APP_DIR}
  bun install
  bun run build
EOF

echo "▶ 6/8 إنشاء ملف البيئة (إذا غير موجود)..."
if [ ! -f ${APP_DIR}/.env.production ]; then
cat > ${APP_DIR}/.env.production <<EOF
# قيم Lovable Cloud الجاهزة (مفاتيح عامة فقط)
VITE_SUPABASE_URL=https://eyccrpqjcdszzmquddto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Y2NycHFqY2RzenptcXVkZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTczNDMsImV4cCI6MjA5NDc5MzM0M30.1dSiWcyI0IiFfM6JDnImdad43aMbzD7UgLRciqaSCAs
VITE_SUPABASE_PROJECT_ID=eyccrpqjcdszzmquddto
SUPABASE_URL=https://eyccrpqjcdszzmquddto.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Y2NycHFqY2RzenptcXVkZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTczNDMsImV4cCI6MjA5NDc5MzM0M30.1dSiWcyI0IiFfM6JDnImdad43aMbzD7UgLRciqaSCAs
PORT=${APP_PORT}
NODE_ENV=production
EOF
chown ${APP_USER}:${APP_USER} ${APP_DIR}/.env.production
fi

echo "▶ 7/8 تشغيل التطبيق عبر PM2 (production server)..."
fuser -k ${APP_PORT}/tcp 2>/dev/null || true
sudo -u ${APP_USER} bash <<EOF
  set -e
  export PATH="\$HOME/.bun/bin:/usr/bin:\$PATH"
  cd ${APP_DIR}
  set -a
  [ -f .env.production ] && . ./.env.production
  export PORT="${APP_PORT}"
  export NODE_ENV=production
  set +a
  pm2 delete ${APP_NAME} 2>/dev/null || true

  ENTRY=""
  for candidate in \
    .output/server/index.mjs \
    .output/server/server/index.mjs \
    dist/server/index.mjs \
    dist/index.mjs
  do
    if [ -f "\$candidate" ]; then
      ENTRY="\$candidate"
      break
    fi
  done

  if [ -n "\$ENTRY" ]; then
    pm2 start "\$ENTRY" --name ${APP_NAME} --interpreter node --update-env
  else
    pm2 start "bun run preview -- --host 0.0.0.0 --port ${APP_PORT}" --name ${APP_NAME} --update-env
  fi
  pm2 save
EOF
env PATH=$PATH:/usr/bin pm2 startup systemd -u ${APP_USER} --hp /home/${APP_USER} | tail -1 | bash || true

echo "▶ 8/8 إعداد Nginx + SSL (Let's Encrypt)..."
cat > /etc/nginx/sites-available/${APP_NAME} <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }
}
EOF
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/${APP_NAME}
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos -m ${EMAIL} --redirect || \
  echo "⚠ فشل إصدار SSL — تأكد أن DNS للنطاق ${DOMAIN} يشير إلى IP السيرفر ثم نفذ: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"

echo ""
echo "✅ التثبيت اكتمل!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 الموقع:        https://${DOMAIN}"
echo "📂 مسار التطبيق:  ${APP_DIR}"
echo "👤 مستخدم النشر:  ${APP_USER}"
echo "🔌 المنفذ الداخلي: ${APP_PORT}"
echo ""
echo "للنشر التلقائي من GitHub Actions أضف هذه الـ Secrets في المستودع:"
echo "   VPS_HOST     = <IP السيرفر>"
echo "   VPS_USER     = ${APP_USER}"
echo "   VPS_PORT     = 22"
echo "   VPS_SSH_KEY  = <المفتاح الخاص ed25519>"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
