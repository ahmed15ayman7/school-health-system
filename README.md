# منظومة الإدارة الطبية المركزية والمقصف المدرسي

Next.js 16 + TypeScript + Prisma 6 + PostgreSQL + Auth.js v5 + Tailwind 4.

## التطوير المحلي

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Postgres محلي (اختياري): `docker compose up -d` — يشغّل Postgres فقط من `docker-compose.yml`.

افتح `http://localhost:3000/login` — `admin / admin123` أو `nurse.b / nurse123`.

## النشر — Dockerfile فقط

على السيرفر (PostgreSQL خارجي، Nginx أمام الحاوية):

```bash
cd school-health-system
docker build -t school-health .
docker stop school-health 2>/dev/null; docker rm school-health 2>/dev/null

docker run -d \
  --name school-health \
  -p 127.0.0.1:3000:3000 \
  -e DATABASE_URL='postgresql://USER:PASS@HOST:PORT/DB?schema=public' \
  -e AUTH_SECRET='ضع-قيمة-من-openssl-rand-base64-32' \
  -e AUTH_URL='https://perplexity.ifacegb.net' \
  -e APP_TIMEZONE='Asia/Qatar' \
  -e UPLOAD_DIR='/app/uploads' \
  -e RUN_DB_PUSH='true' \
  -v school-health-uploads:/app/uploads \
  --restart unless-stopped \
  school-health
```

- **`AUTH_URL`**: نفس رابط المتصفح، `https`، **بدون** `/` في الآخر.
- **`RUN_DB_PUSH=true`**: أول نشر فقط؛ بعدها شغّل الحاوية بـ `RUN_DB_PUSH=false` أو احذف المتغير.
- **Seed**: من جهاز فيه الكود — `DATABASE_URL` نفس السيرفر ثم `npm run db:seed` (الصورة لا تحتوي أداة seed).

تحديث بعد تعديل الكود:

```bash
docker build -t school-health .
docker stop school-health && docker rm school-health
# أعد docker run بنفس المتغيرات (RUN_DB_PUSH=false)
```

### Nginx (مثال)

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

بدون `X-Forwarded-Proto` قد يفشل تسجيل الدخول خلف HTTPS.

## API

REST تحت `/api/v1/**` مع غلاف `{ success, data, error, meta }`.

## هيكل

- `prisma/schema.prisma` — الموديلات
- `src/server/router.ts` — منطق API
- `Dockerfile` — بناء standalone + Prisma runtime
