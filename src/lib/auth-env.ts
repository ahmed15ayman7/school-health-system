/** عنوان التطبيق العام (Auth.js + إعادة التوجيه خلف reverse proxy) */
export function publicAppUrl(): string | undefined {
  const raw = process.env.AUTH_URL?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/$/, "");
}

/** كوكيز الجلسة الآمنة عندما AUTH_URL يبدأ بـ https */
export function authSecureCookies(): boolean {
  return publicAppUrl()?.startsWith("https://") === true;
}
