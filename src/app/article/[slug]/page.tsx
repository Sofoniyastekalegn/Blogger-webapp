import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { fetchArticleBySlug, getAuthor, getFeaturedImage } from "../../../lib/wp";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);
  if (!article) return notFound();

  const img = getFeaturedImage(article);
  const author = getAuthor(article);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Back to home
      </Link>
      <h1 className="mt-4 text-3xl font-bold">
        <span dangerouslySetInnerHTML={{ __html: article.title.rendered }} />
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        {new Date(article.date).toLocaleDateString()}
        {author ? ` • ${author.name}` : null}
      </p>
      {img.url ? (
        <div className="mt-6">
          <Image
            src={img.url}
            alt={img.alt}
            width={1200}
            height={800}
            className="h-auto w-full rounded"
          />
        </div>
      ) : null}
      <article
        className="prose prose-neutral mt-8 max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: article.content.rendered }}
      />
    </div>
  );
}