export function formatIDR(value?: number | null, options?: { compact?: boolean }): string {
  if (value == null) return "—";
  
  const { compact = false } = options ?? {};
  
  if (compact && value >= 1_000_000_000) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 1 })
      .format(value / 1_000_000_000).replace("IDR", "Rp").trim() + " M";
  }
  if (compact && value >= 1_000_000) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 1 })
      .format(value / 1_000_000).replace("IDR", "Rp").trim() + " Jt";
  }
  
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace("IDR", "Rp").trim();
}

export function formatDateID(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return "Belum pernah";
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  
  if (abs < min) return "Baru saja";
  if (abs < hour) return `${Math.floor(abs / min)} menit lalu`;
  if (abs < day) return `${Math.floor(abs / hour)} jam lalu`;
  if (abs < 7 * day) return `${Math.floor(abs / day)} hari lalu`;
  return formatDateID(iso);
}