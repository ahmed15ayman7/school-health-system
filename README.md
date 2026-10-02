# منظومة الإدارة الطبية المركزية والمقصف المدرسي

Next.js 16 + TypeScript + Prisma 6 + PostgreSQL + Auth.js v5 + Tailwind 4 + shadcn-style UI + framer-motion.

## التشغيل

```bash
docker compose up -d
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

افتح `http://localhost:3000/login` — `admin / admin123` أو `nurse.b / nurse123`.

## النشر (HTTPS)

في `.env` على السيرفر:

- `AUTH_URL=https://your-domain` — **بدون** `/` في النهاية، ونفس رابط المتصفح.
- `AUTH_SECRET` — قيمة عشوائية قوية (مثلاً `openssl rand -base64 32`).
- `DATABASE_URL` — اتصال Postgres يصل من داخل حاوية Docker.

بعد تعديل `.env`: `docker compose -f docker-compose.prod.yml up -d --build`.

خلف Nginx أمام الحاوية على `:3000` أضف على الأقل:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

بدون `X-Forwarded-Proto` قد يفشل تسجيل الدخول أو تُرفض الجلسة بعده.

## API

REST تحت `/api/v1/**` مع غلاف `{ success, data, error, meta }`.

## هيكل

- `prisma/schema.prisma` — 62+ موديل (20 وحدة)
- `src/server/router.ts` — منطق API المركزي
- `src/server/pharmacy/mar.service.ts` — MAR ذرّي + FIFO
- `src/server/notifications/channels.ts` — in-app + SMS/WhatsApp simulated

## PWA

`public/sw.js` + `manifest.webmanifest` — طابور offline للسجلات السريرية (مراجعة يدوية عند التعارض).
# school-health-system
# school-health-system
