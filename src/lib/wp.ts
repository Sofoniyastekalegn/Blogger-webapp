const WP_URL = process.env.WORDPRESS_URL;

if (!WP_URL) {
  throw new Error("WORDPRESS_URL is not set. Add it to .env.local");
}

type FetchOpts = {
  cache?: RequestCache;
  next?: { revalidate?: number };
};

export async function wpFetch<T>(path: string, opts: FetchOpts = {}) {
  const url = `${WP_URL.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    cache: opts.cache ?? "no-store",
    next: opts.next,
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WP fetch failed ${res.status}: ${url}\n${text}`);
  }
  return (await res.json()) as T;
}

// Custom post type "article" (REST base usually /wp-json/wp/v2/article)
const BASE = "/wp-json/wp/v2";

export type WPUser = {
  id: number;
  name: string;
  slug: string;
};

export type WPCategory = {
  id: number;
  name: string;
  slug: string;
};

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

  return wpFetch<WPArticle[]>(`${BASE}/article?${query.toString()}`);
}

export async function fetchArticleBySlug(slug: string) {
  const query = new URLSearchParams({ _embed: "1", slug });
  const items = await wpFetch<WPArticle[]>(`${BASE}/article?${query.toString()}`);
  return items[0] ?? null;
}

export async function fetchCategories() {
  // Default categories endpoint (works for posts and CPT taxonomy if shared)
  return wpFetch<WPCategory[]>(`${BASE}/categories?per_page=100`);
}

export async function fetchCategoryBySlug(slug: string) {
  const cats = await wpFetch<WPCategory[]>(`${BASE}/categories?slug=${encodeURIComponent(slug)}`);
  return cats[0] ?? null;
}

export function getFeaturedImage(article: WPArticle) {
  const media = article._embedded?.["wp:featuredmedia"]?.[0];
  const url =
    media?.media_details?.sizes?.medium?.source_url ??
    media?.source_url ??
    undefined;
  return { url, alt: media?.alt_text ?? article.title.rendered };
}

export function getAuthor(article: WPArticle) {
  return article._embedded?.author?.[0];
}