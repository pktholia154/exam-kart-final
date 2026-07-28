import { Metadata } from "next";
import Link from "next/link";
import { getCategoriesServer, getBooksServer, SITE_URL, slugify, CATEGORY_SEO_DATA } from "@/lib/books-server";
import { Grid, ChevronRight, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Explore All Exam Categories | Exam Kart E-Book Store",
  description: "Browse exam preparation e-books by category: Banking Exams, UPSC, SSC, Railways, Defense, Insurance, Teaching, Engineering, and more.",
  alternates: {
    canonical: `${SITE_URL}/categories`,
  },
  openGraph: {
    title: "All Exam Categories | Exam Kart E-Book Store",
    description: "Browse exam preparation e-books, previous year solved papers, and mock tests organized by exam category.",
    url: `${SITE_URL}/categories`,
    siteName: "Exam Kart E-Book Store",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function CategoriesPage() {
  const categories = await getCategoriesServer();
  const books = await getBooksServer();

  const getBookCount = (catName: string) => {
    return books.filter((b) => b.category?.toLowerCase() === catName.toLowerCase()).length;
  };

  const jsonLdCategories = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/categories#webpage`,
        name: "Exam Categories",
        description: "Browse exam preparation e-books by category.",
        url: `${SITE_URL}/categories`,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/categories#breadcrumb`,
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
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen pt-4 pb-24 max-w-md mx-auto px-4 overflow-x-hidden bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCategories) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-3 text-[11px] text-gray-500 font-medium">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
          </li>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <li className="text-gray-900 font-bold" aria-current="page">
            Categories
          </li>
        </ol>
      </nav>

      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Grid className="w-5 h-5 text-[#3A20BA]" /> Browse Categories
          </h1>
          <p className="text-xs text-gray-600 mt-1 font-medium leading-relaxed">
            Find solved question papers, prep guides, and academic documents categorized for fast indexing and structured learning.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat, i) => {
            const catSlug = cat.seoslug || slugify(cat.name);
            const bookCount = getBookCount(cat.name);
            const seoInfo = CATEGORY_SEO_DATA[catSlug];

            const colors = [
              "bg-[#3A20BA]/5 border-[#3A20BA]/10 hover:bg-[#3A20BA]/10",
              "bg-[#2053BA]/5 border-[#2053BA]/10 hover:bg-[#2053BA]/10",
              "bg-[#8720BA]/5 border-[#8720BA]/10 hover:bg-[#8720BA]/10",
            ];
            const textColors = ["text-[#3A20BA]", "text-[#2053BA]", "text-[#8720BA]"];
            const styleIdx = i % 3;

            return (
              <Link
                key={cat.id || i}
                href={`/categories/${catSlug}`}
                className={`rounded-2xl p-4 shadow-sm border text-left aspect-[1.3] flex flex-col justify-between active:scale-95 transition-all group ${colors[styleIdx]}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-white shadow-sm border border-black/5 ${textColors[styleIdx]}`}
                >
                  {cat.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xs font-extrabold text-gray-900 group-hover:text-[#3A20BA] transition-colors leading-snug line-clamp-2">
                    {cat.name}
                  </h2>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-semibold">
                    {bookCount} {bookCount === 1 ? "E-Book" : "E-Books"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* SEO Descriptive Footer Copy */}
        <section className="pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-2">
          <h2 className="text-xs font-bold text-gray-800">
            About Our Competitive Exam Categories
          </h2>
          <p className="leading-relaxed">
            Exam Kart organizes all study materials into clean, dedicated exam categories.
            Whether you are preparing for Banking (IBPS, SBI PO), UPSC Civil Services, SSC CGL,
            Railways RRB NTPC, Defense NDA/CDS, or Teaching CTET exams, each category offers
            complete solved question papers, mock tests, and subject guides.
          </p>
        </section>
      </div>
    </main>
  );
}
