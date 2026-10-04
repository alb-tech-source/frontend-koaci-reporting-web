import api from "./axios";

const PAGE_LIMIT = 100;

/** Ambil seluruh halaman endpoint list (limit backend maks. 100 per halaman). */
export async function fetchAllPages<T>(
  url: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const rows: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const { data } = await api.get(url, {
      params: { ...params, page, limit: PAGE_LIMIT },
    });
    // List bisa datang sebagai data.items, data (array), atau tanpa pembungkus
    const payload = data?.data ?? data;
    const items: T[] = Array.isArray(payload) ? payload : (payload?.items ?? []);
    rows.push(...items);
    // Fallback bila backend tidak mengirim meta: lanjut selama halaman penuh
    totalPages =
      data?.meta?.totalPages ??
      payload?.meta?.totalPages ??
      (items.length === PAGE_LIMIT ? page + 1 : page);
    page += 1;
  } while (page <= totalPages);

  return rows;
}
