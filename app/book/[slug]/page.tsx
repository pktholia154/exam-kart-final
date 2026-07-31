import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBookBySlugServer,
  getRelatedBooksServer,
  slugify,
  SITE_URL,
} from "@/lib/books-server";
import { BookActions } from "@/components/BookActions";
import { ProceduralCover } from "@/components/ProceduralCover";
import { BookCard } from "@/components/BookCard";
import Markdown from "react-markdown";
import { ReviewsSection } from "@/components/ReviewsSection";
import {
  Star,
  Globe,
  Tag,
  HardDrive,
  BookOpen,
  Download,
  ChevronRight,
  ArrowLeft,
  Building2,
  FileCheck2,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const book = await getBookBySlugServer(resolvedParams.slug);

  if (!book) {
    return {
      title: "Book Not Found | Exam Kart E-Book Store",
      description: "The requested competitive exam e-book could not be found.",
      robots: { index: false, follow: true },
    };
  }

  const canonicalUrl = `${SITE_URL}/book/${book.seoslug}`;
  const title = `${book.title} PDF - Solved Paper & Study Guide | Exam Kart`;
  const description =
    book.seoDescription ||
    `Download ${book.title} PDF e-book for ${book.category} prep. Author/Publisher: ${book.publisher}. Buy at ₹${book.buyprice}.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Exam Kart E-Book Store",
      type: "article",
      images: [
        {
          url: `${SITE_URL}/api/og?title=${encodeURIComponent(
            book.title
          )}&category=${encodeURIComponent(book.category)}`,
          width: 1200,
          height: 630,
          alt: book.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

export default async function BookDetailsPage({ params }: BookPageProps) {
  const resolvedParams = await params;
  const book = await getBookBySlugServer(resolvedParams.slug);

  if (!book) {
    notFound();
  }

  const categorySlug = slugify(book.category);
  const relatedBooks = await getRelatedBooksServer(book.category, book.seoslug);
  const canonicalUrl = `${SITE_URL}/book/${book.seoslug}`;

  // Structured Data (JSON-LD)
  const jsonLdBookAndProduct = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Book",
        "@id": `${canonicalUrl}#book`,
        name: book.title,
        description: book.fullDescription || book.seoDescription,
        inLanguage: book.language || "English",
        numberOfPages: book.pageCount,
        publisher: {
          "@type": "Organization",
          name: book.publisher || "Exam Kart Press",
        },
        genre: book.category,
        keywords: book.tags ? book.tags.join(", ") : book.category,
        url: canonicalUrl,
      },
      {
        "@type": "Product",
        "@id": `${canonicalUrl}#product`,
        name: book.title,
        description: book.seoDescription,
        category: book.category,
        brand: {
          "@type": "Brand",
          name: "Exam Kart",
        },
        offers: {
          "@type": "Offer",
          price: book.buyprice,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: canonicalUrl,
          priceValidUntil: "2027-12-31",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: book.averageRating || 4.5,
          reviewCount: book.reviewCount || 50,
          bestRating: "5",
          worstRating: "1",
        },
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
            name: book.category,
            item: `${SITE_URL}/categories/${categorySlug}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: book.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen max-w-md md:max-w-2xl mx-auto bg-white pb-20 relative overflow-x-hidden">
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBookAndProduct) }}
      />

      {/* Top Header & Navigation */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-2.5 py-2 flex items-center justify-between border-b border-gray-100">
        <Link
          href={`/categories/${categorySlug}`}
          className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-800 hover:bg-gray-100 transition-colors"
          aria-label="Back to Category"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="text-xs font-bold text-gray-600 truncate max-w-[200px]">
          {book.category}
        </span>
        <Link
          href="/search"
          className="text-xs font-bold text-[#2053BA] hover:underline"
        >
          Search
        </Link>
      </div>

      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="px-2.5 py-2 text-[10px] font-medium text-gray-500 overflow-x-auto no-scrollbar"
      >
        <ol className="flex items-center gap-1 whitespace-nowrap">
          <li>
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
          </li>
          <ChevronRight className="w-2.5 h-2.5 text-gray-300 shrink-0" />
          <li>
            <Link href="/categories" className="hover:text-gray-900 transition-colors">
              Categories
            </Link>
          </li>
          <ChevronRight className="w-2.5 h-2.5 text-gray-300 shrink-0" />
          <li>
            <Link
              href={`/categories/${categorySlug}`}
              className="hover:text-[#2053BA] font-semibold text-gray-700 transition-colors"
            >
              {book.category}
            </Link>
          </li>
          <ChevronRight className="w-2.5 h-2.5 text-gray-300 shrink-0" />
          <li className="text-gray-900 font-bold truncate max-w-[120px]" aria-current="page">
            {book.title}
          </li>
        </ol>
      </nav>

      {/* Main Article Content */}
      <article className="px-2.5 space-y-4 pt-1">
        {/* Book Header Hero */}
        <div className="flex gap-3 items-start">
          <div className="w-[100px] shrink-0 rounded overflow-hidden bg-white">
            <ProceduralCover title={book.title} className="w-full" />
          </div>

          <div className="flex-1 min-w-0">
            <Link
              href={`/categories/${categorySlug}`}
              className="inline-block text-[9px] font-extrabold text-[#8720BA] uppercase tracking-wider mb-0.5 hover:underline"
            >
              {book.category}
            </Link>
            <h1 className="text-base font-black text-gray-900 leading-snug mb-1.5">
              {book.title}
            </h1>

            <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1.5">
              <Star className="w-3.5 h-3.5 text-[#BA8720] fill-current" />
              <span className="text-xs font-bold text-gray-900">
                {typeof book.averageRating === "number"
                  ? book.averageRating.toFixed(1)
                  : book.averageRating || "4.5"}
              </span>
              <span className="text-gray-400 text-[10px]">({book.reviewCount || 0} reviews)</span>
            </div>

            <div className="text-[11px] font-medium text-gray-600 mb-2 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-gray-400" />
              Publisher:{" "}
              <span className="font-bold text-gray-900">
                {book.publisher || "Exam Kart Press"}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-gray-900">₹{book.buyprice}</span>
              {Number(book.listprice) > Number(book.buyprice) && (
                <span className="text-xs text-gray-400 line-through font-medium">
                  ₹{book.listprice}
                </span>
              )}
              {Number(book.listprice) > Number(book.buyprice) && (
                <span className="text-[9px] font-bold text-[#53BA20] bg-[#53BA20]/10 px-1 py-0.5 rounded">
                  {Math.round(
                    ((Number(book.listprice) - Number(book.buyprice)) /
                      Number(book.listprice)) *
                      100
                  )}
                  % OFF
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Client Interactive Action Buttons */}
        <div className="py-1">
          <BookActions book={book} />
        </div>

        {/* About Book & Full Description */}
        <section className="py-1 space-y-2">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-[#2053BA]" /> About this E-Book
          </h2>
          <div className="prose prose-xs max-w-none text-xs text-gray-700 leading-relaxed font-normal space-y-2">
            {book.seoDescription && (
              <p className="font-medium text-gray-800">
                {book.seoDescription}
              </p>
            )}
            {book.fullDescription && book.fullDescription !== book.seoDescription && (
              <div className="text-gray-600 leading-relaxed">
                <Markdown>{book.fullDescription}</Markdown>
              </div>
            )}
            {!book.seoDescription && !book.fullDescription && (
              <p className="font-medium text-gray-800">
                No description available.
              </p>
            )}
          </div>

          {/* Tags */}
          {book.tags && book.tags.length > 0 && (
            <div className="pt-2">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Keywords & Topics
              </span>
              <div className="flex flex-wrap gap-1">
                {book.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 text-[9px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full"
                  >
                    <Tag className="w-2.5 h-2.5 text-[#2053BA]" /> {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* E-Book Specifications */}
        <section className="py-1 space-y-2">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            E-Book Specifications
          </h2>

          <div className="grid grid-cols-2 gap-y-3 gap-x-3 py-1">
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                <Globe className="w-3 h-3 text-[#2053BA]" /> Language
              </span>
              <span className="text-xs font-bold text-gray-900">
                {book.language || "English"}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                <BookOpen className="w-3 h-3 text-[#2053BA]" /> Pages
              </span>
              <span className="text-xs font-bold text-gray-900">
                {book.pageCount || "150+"} Pages
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                <HardDrive className="w-3 h-3 text-[#2053BA]" /> File Size
              </span>
              <span className="text-xs font-bold text-gray-900">
                {book.fileSizeInMB ? `${book.fileSizeInMB} MB` : "12.5 MB"}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                <Download className="w-3 h-3 text-[#2053BA]" /> Format
              </span>
              <span className="text-xs font-bold text-gray-900">
                PDF (Instant Download)
              </span>
            </div>
          </div>
        </section>

        {/* Ratings & Reviews Section */}
        <ReviewsSection bookId={book.id} />
      </article>

      {/* Crawlable Related Books Section */}
      {relatedBooks.length > 0 && (
        <aside className="px-2.5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-gray-900 tracking-tight">
              Related Books in {book.category}
            </h2>
            <Link
              href={`/categories/${categorySlug}`}
              className="text-[11px] font-bold text-[#2053BA] hover:underline"
            >
              View Category
            </Link>
          </div>

          {/* Display in a single row showing 4 book items at a time */}
          <div className="grid grid-cols-4 gap-1.5">
            {relatedBooks.slice(0, 4).map((relBook) => (
              <BookCard key={relBook.id || relBook.seoslug} book={relBook} layout="grid" />
            ))}
          </div>
        </aside>
      )}
    </main>
  );
}
