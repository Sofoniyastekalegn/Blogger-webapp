const WP_API = process.env.WP_API_URL ?? process.env.NEXT_PUBLIC_WP_API_URL;
if (!WP_API) {
  throw new Error("WP_API_URL or NEXT_PUBLIC_WP_API_URL is not set. Add it to .env.local");
}
const API_BASE = WP_API.replace(/\/$/, "");
const RESOURCE = (process.env.WP_RESOURCE ?? process.env.NEXT_PUBLIC_WP_RESOURCE ?? "article").replace(/^\//, "");
const BASE = "/wp/v2";

type FetchOpts = { cache?: RequestCache; next?: { revalidate?: number } };

async function wpFetch<T>(path: string, opts: FetchOpts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    cache: opts.cache ?? "no-store",
    next: opts.next,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WP fetch failed ${res.status}: ${url}\n${text}`);
  }
  return (await res.json()) as T;
}

export type WPUser = { id: number; name: string; slug: string };
export type WPCategory = { id: number; name: string; slug: string };
export type WPEmbeddedMedia = {
  source_url?: string;
  alt_text?: string;
  media_details?: { sizes?: Record<string, { source_url: string; width: number; height: number }> };
};
export type WPArticle = {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  excerpt?: { rendered: string };
  author: number;
  categories?: number[];
  _embedded?: {
    author?: WPUser[];
    "wp:featuredmedia"?: WPEmbeddedMedia[];
    "wp:term"?: (WPCategory[])[];
  };
};

export async function fetchArticles(params?: {
  per_page?: number;
  page?: number;
  category?: number;
  search?: string;
}) {
  const query = new URLSearchParams({
    _embed: "1",
    per_page: String(params?.per_page ?? 10),
    page: String(params?.page ?? 1),
  });
  if (params?.category) query.set("categories", String(params.category));
  if (params?.search) query.set("search", params.search);
  return wpFetch<WPArticle[]>(`${BASE}/${RESOURCE}?${query.toString()}`);
}

export async function fetchArticleById(id: number) {
  const query = new URLSearchParams({ _embed: "1" });
  return wpFetch<WPArticle>(`${BASE}/${RESOURCE}/${id}?${query.toString()}`);
}

export async function fetchArticleBySlug(slug: string) {
  const query = new URLSearchParams({ _embed: "1", slug });
  const items = await wpFetch<WPArticle[]>(`${BASE}/${RESOURCE}?${query.toString()}`);
  return items[0] ?? null;
}

export async function fetchCategories() {
  return wpFetch<WPCategory[]>(`${BASE}/categories?per_page=100`);
}

export async function fetchCategoryBySlug(slug: string) {
  const cats = await wpFetch<WPCategory[]>(`${BASE}/categories?slug=${encodeURIComponent(slug)}`);
  return cats[0] ?? null;
}

export function getFeaturedImage(article: WPArticle) {
  const media = article._embedded?.["wp:featuredmedia"]?.[0];
  const url = media?.media_details?.sizes?.medium?.source_url ?? media?.source_url ?? undefined;
  return { url, alt: media?.alt_text ?? article.title.rendered };
}

export function getAuthor(article: WPArticle) {
  return article._embedded?.author?.[0];
}