// "Shadow cookie" non-HttpOnly yang hanya dibaca middleware untuk redirect / ↔ /admin.
// Bukan batas keamanan — otorisasi sebenarnya tetap di backend.
const ROLE_COOKIE = "user_role";
const ONE_DAY_SECONDS = 86400;

function cookieAttributes(maxAge: number): string {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  return `path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export function setRoleCookie(role: string) {
  if (typeof window === "undefined") return;
  document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(role)}; ${cookieAttributes(ONE_DAY_SECONDS)}`;
}

export function clearRoleCookie() {
  if (typeof window === "undefined") return;
  document.cookie = `${ROLE_COOKIE}=; ${cookieAttributes(0)}`;
}
