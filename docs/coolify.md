# النشر على Coolify (Dockerfile فقط)

## General

| الحقل | القيمة |
|--------|--------|
| Build Pack | **Dockerfile** |
| Domains | `https://perplexity.ifacegb.net` (بدون `/` زائدة) |
| Port / Exposes | **3000** (Next.js standalone) |

## Healthcheck (تبويب Healthcheck)

| | |
|--|--|
| Path | `/api/v1/health` |
| Port | `3000` |
| Method | GET |

بدون healthcheck يظهر **Running (unknown)** وقد يقطع البروكسي أثناء التشغيل.

## Environment Variables (Production)

```env
DATABASE_URL=postgres://USER:PASS@HOST:5432/postgres
AUTH_SECRET=قيمة-قوية-openssl-rand-base64-32
AUTH_URL=https://perplexity.ifacegb.net
APP_TIMEZONE=Asia/Qatar
UPLOAD_DIR=/app/uploads
RUN_DB_PUSH=true
```

- **`DATABASE_URL`**: على Coolify استخدم hostname الداخلي لـ Postgres (مثل `x5hz7092...:5432`) إذا الخدمة على نفس الشبكة.
- **`RUN_DB_PUSH=true`**: **مرة واحدة** بعد أول نشر ناجح، ثم احذفها أو `false` وأعد **Redeploy**.
- **`AUTH_URL`**: يطابق حقل Domains بالضبط (`https`).

Seed (اختياري): من جهازك المحلي بنفس `DATABASE_URL` العام (إن متاح) أو من Terminal في Coolify بعد تثبيت أدوات التطوير — الأسهل: `npm run db:seed` محلياً ضد DB إذا المنفذ مفتوح.

## ERR_FAILED في المتصفح

1. **Logs** في Coolify — هل `node server.js` يعمل؟ أخطاء Prisma؟
2. **Redeploy** بعد حفظ المتغيرات.
3. تأكد **DNS** للنطاق يشير لسيرفر Coolify وشهادة SSL **Valid**.
4. جرّب نافذة خاصة أو `/login` مباشرة.
5. أثناء البuild/Restart البروكسي قد يعيد `ERR_FAILED` — انتظر دقيقة.

## تسجيل الدخول لا يعمل (AUTH_URL)

- `AUTH_URL` = نفس رابط الموقع في المتصفح.
- `AUTH_SECRET` ثابت ولا يتغير بين Redeploy.
- انشر آخر نسية من الكود (إصلاح كوكي HTTPS في `middleware.ts`).
- Coolify/Traefik يمرّر `X-Forwarded-Proto` تلقائياً عادةً.

## بعد كل push للكود

**Redeploy** من لوحة Coolify (Build Pack Dockerfile).
