import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCategoryBySlugServer,
  getCategoriesServer,
  SITE_URL,
  slugify,
} from "@/lib/books-server";
import { BookCard } from "@/components/BookCard";
import { ChevronRight, BookOpen, Inbox, ChevronLeft } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getCategoryBySlugServer(resolvedParams.slug);

  if (!data) {
    return {
      title: "Category Not Found | Exam Kart",
      description: "The requested category could not be found.",
      robots: { index: false, follow: true },
    };
  }

  const { category, seo } = data;
  const canonicalUrl = `${SITE_URL}/categories/${category.seoslug}`;

  return {
    title: `${seo.title} | Exam Kart`,
    description: seo.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonicalUrl,
      siteName: "Exam Kart E-Book Store",
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  };
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const data = await getCategoryBySlugServer(resolvedParams.slug);

  if (!data) {
    notFound();
  }

  const { category, books, seo } = data;
  const allCategories = await getCategoriesServer();
  const canonicalUrl = `${SITE_URL}/categories/${category.seoslug}`;

  // Structured Data (JSON-LD)
  const jsonLdCategory = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonicalUrl}#webpage`,
        name: `${category.name} E-Books`,
        description: seo.description,
        url: canonicalUrl,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Categories",
            item: `${SITE_URL}/categories`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: category.name,
            item: canonicalUrl,
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${canonicalUrl}#itemlist`,
        name: `${category.name} Books Collection`,
        numberOfItems: books.length,
        itemListElement: books.map((b, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: b.title,
          url: `${SITE_URL}/book/${b.seoslug}`,
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen pt-3 pb-24 max-w-md md:max-w-2xl mx-auto px-2.5 overflow-x-hidden bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCategory) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-2.5 text-[11px] text-gray-500 font-medium">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
          </li>
          <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
          <li>
            <Link href="/categories" className="hover:text-gray-900 transition-colors">
              Categories
            </Link>
          </li>
          <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
          <li className="text-gray-900 font-bold truncate max-w-[150px]" aria-current="page">
            {category.name}
          </li>
        </ol>
      </nav>

      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <Link
            href="/categories"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
            aria-label="Back to Categories"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-[10px] font-bold text-[#8720BA] uppercase tracking-wider">
              Exam Category
            </p>
            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
              {category.name}
            </h1>
          </div>
        </div>

        {/* Category Description Copy */}
        <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 text-xs text-gray-700 leading-relaxed space-y-1.5">
          <p className="font-semibold text-gray-900">{seo.description}</p>
          <p className="text-gray-600 font-normal">{seo.longContent}</p>
        </div>

        {/* Crawlable Quick-Switch Category Pills */}
        <div className="-mx-2.5 px-2.5 overflow-x-auto no-scrollbar flex gap-2">
          {allCategories.map((cat, idx) => {
            const catSlug = cat.seoslug || slugify(cat.name);
            const isActive = catSlug === category.seoslug;
            return (
              <Link
                key={cat.id || idx}
                href={`/categories/${catSlug}`}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all active:scale-95 ${
                  isActive
                    ? "bg-[#3A20BA] text-white border-transparent shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>

        {/* Books List in Category */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#3A20BA]" /> Curated Materials ({books.length})
          </h2>

          {books.length > 0 ? (
            <div className="flex flex-col gap-3">
              {books.map((book) => (
                <BookCard key={book.id || book.seoslug} book={book} layout="list" />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-3xl p-8 flex flex-col items-center text-center gap-3 border border-dashed border-gray-200">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900">No books found in {category.name}</h3>
                <p className="text-[10px] text-gray-500 mt-1 max-w-[220px] mx-auto font-medium leading-relaxed">
                  We are currently uploading latest exam books for {category.name}. Check back soon!
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
