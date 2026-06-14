#!/usr/bin/env bash
# =====================================================================
# VPS Bootstrap Script — Ubuntu/Debian 22.04+
# تثبيت كل المتطلبات لتشغيل display-hub-express على VPS جديد
#
# الاستخدام (كـ root أو sudo):
#   curl -fsSL <raw-url>/scripts/vps-setup.sh | sudo bash -s -- \
#     yourdomain.com  your-email@example.com  git@github.com:vipstar2026/display-hub-express.git
#
# أو يدوياً:
#   sudo bash vps-setup.sh yourdomain.com your-email@example.com <git-url>
# =====================================================================
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
REPO_URL="${3:-git@github.com:vipstar2026/display-hub-express.git}"
APP_NAME="display-hub"
APP_USER="deploy"
APP_DIR="/home/${APP_USER}/${APP_NAME}"
APP_PORT="3000"

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "❌ الاستخدام: sudo bash vps-setup.sh <domain> <email> [git-url]"
  exit 1
fi

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
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> /home/${APP_USER}/.bashrc

echo "▶ 4/8 إعداد جدار الحماية..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "▶ 5/8 استنساخ المشروع..."
sudo -u ${APP_USER} bash <<EOF
  set -e
  export PATH="\$HOME/.bun/bin:\$PATH"
  if [ ! -d "${APP_DIR}" ]; then
    git clone ${REPO_URL} ${APP_DIR}
  fi
  cd ${APP_DIR}
  bun install
  bun run build
EOF

echo "▶ 6/8 إنشاء ملف البيئة..."
cat > ${APP_DIR}/.env.production <<EOF
# املأ هذه القيم بعد التثبيت
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=${APP_PORT}
EOF
chown ${APP_USER}:${APP_USER} ${APP_DIR}/.env.production

echo "▶ 7/8 تشغيل التطبيق عبر PM2 (wrangler)..."
sudo -u ${APP_USER} bash <<EOF
  set -e
  export PATH="\$HOME/.bun/bin:/usr/bin:\$PATH"
  cd ${APP_DIR}
  pm2 delete ${APP_NAME} 2>/dev/null || true
  pm2 start "bunx wrangler dev --ip 0.0.0.0 --port ${APP_PORT} --local" --name ${APP_NAME}
  pm2 save
EOF
env PATH=$PATH:/usr/bin pm2 startup systemd -u ${APP_USER} --hp /home/${APP_USER}

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
  echo "⚠ فشل إصدار SSL — تأكد أن DNS للنطاق يشير إلى IP السيرفر ثم أعد تشغيل: certbot --nginx -d ${DOMAIN}"

echo ""
echo "✅ التثبيت اكتمل!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 مسار التطبيق:  ${APP_DIR}"
echo "👤 مستخدم النشر:  ${APP_USER}"
echo "🌐 النطاق:        https://${DOMAIN}"
echo "🔌 المنفذ الداخلي: ${APP_PORT}"
echo ""
echo "الخطوات التالية:"
echo "  1) املأ القيم في:  ${APP_DIR}/.env.production"
echo "  2) أعد التشغيل:    sudo -u ${APP_USER} pm2 restart ${APP_NAME}"
echo "  3) أضف مفتاح SSH لـ ${APP_USER} لتفعيل النشر التلقائي من GitHub Actions"
echo "  4) أضف في GitHub Secrets:"
echo "       VPS_HOST = <IP السيرفر>"
echo "       VPS_USER = ${APP_USER}"
echo "       VPS_SSH_KEY = <المفتاح الخاص>"
echo "       VPS_PORT = 22"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
