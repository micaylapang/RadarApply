export function adminSecret() {
  return (
    process.env.ADMIN_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

export function isAdminAuthorized(request: Request) {
  const expected = adminSecret();
  if (!expected) return false;

  const header = request.headers.get("authorization");
  if (header === `Bearer ${expected}`) return true;

  const url = new URL(request.url);
  if (url.searchParams.get("key") === expected) return true;

  return false;
}
