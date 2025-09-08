import Image from "next/image";
import Link from "next/link";
import { fetchArticles, fetchCategories, getAuthor, getFeaturedImage } from "../lib/wp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [articles, categories] = await Promise.all([
    fetchArticles({ per_page: 10 }),
    fetchCategories(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Blog</h1>
        <nav className="flex gap-4 text-sm">
          {categories.slice(0, 6).map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="hover:underline">
              {c.name}
            </Link>
          ))}
        </nav>
      </header>

      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => {
          const img = getFeaturedImage(a);
          const author = getAuthor(a);
          return (
            <li key={a.id} className="rounded border p-4 hover:shadow">
              {img.url ? (
                <Link href={`/article/${a.slug}`} className="block mb-3">
                  <Image
                    src={img.url}
                    alt={img.alt}
                    width={600}
                    height={400}
                    className="h-40 w-full rounded object-cover"
                  />
                </Link>
              ) : null}
              <h2 className="mb-2 text-lg font-semibold">
                <Link href={`/article/${a.slug}`} className="hover:underline">
                  <span dangerouslySetInnerHTML={{ __html: a.title.rendered }} />
                </Link>
              </h2>
              <p className="mb-1 text-xs text-gray-500">{new Date(a.date).toLocaleDateString()}</p>
              <p className="mb-3 text-sm text-gray-600">
                {author ? `By ${author.name}` : null}
              </p>
              <Link
                href={`/article/${a.slug}`}
                className="inline-block text-sm text-blue-600 hover:underline"
              >
                Read more
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}