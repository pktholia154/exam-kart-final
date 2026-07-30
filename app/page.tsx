import { Metadata } from "next";
import Link from "next/link";
import {
  getBooksServer,
  getCategoriesServer,
  SITE_URL,
  slugify,
} from "@/lib/books-server";
import { BookCard } from "@/components/BookCard";
import { ProceduralCover } from "@/components/ProceduralCover";
import { SearchBarAnimated } from "@/components/SearchBarAnimated";
import { HeaderActions } from "@/components/HeaderActions";
import {
  Search,
  ChevronRight,
  BookOpen,
  Download,
  Shield,
  ShieldCheck,
  FileText,
  RefreshCw,
  Mail,
  MapPin,
  Globe,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Exam Kart | Native Competitive Exam E-Book Store & Solved Papers",
  description:
    "Buy and download competitive exam preparation e-books, solved previous year papers, and mock tests for IBPS, SBI PO, UPSC, SSC CGL, Railways, and Defense.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Exam Kart E-Book Store | Competitive Exam Solved Papers & Guides",
    description:
      "SEO-first native e-book store featuring instant PDF downloads and offline reading for IBPS, SBI, UPSC CSAT, SSC, Railways, and Defense exams.",
    url: SITE_URL,
    siteName: "Exam Kart",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
  },
};

export default async function Home() {
  const books = await getBooksServer();
  const categories = await getCategoriesServer();

  const jsonLdHome = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Exam Kart",
        description: "Native Competitive Exam E-Book Store",
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Exam Kart",
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.ico`,
        contactPoint: {
          "@type": "ContactPoint",
          email: "support@exam-kart.com",
          contactType: "customer service",
        },
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/#featured-books`,
        name: "Featured Competitive Exam E-Books",
        itemListElement: books.slice(0, 8).map((b, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: b.title,
          url: `${SITE_URL}/book/${b.seoslug}`,
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white pb-8 max-w-md md:max-w-2xl mx-auto overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdHome) }}
      />

      {/* Header / Search bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-2.5 pt-3 pb-2 border-b border-gray-100/80">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-extrabold text-[#2053BA] tracking-tight">ExamKart</h1>
          <HeaderActions />
        </div>
        <SearchBarAnimated />
      </header>

      <div className="px-2.5 space-y-5 mt-2.5">
        {/* Banner - Vertical height decreased by 20% */}
        <section className="bg-gradient-to-br from-[#2053BA] via-[#2053BA] to-[#2053BA] rounded-2xl py-3.5 px-4 text-white shadow-md shadow-[#2053BA]/15 relative overflow-hidden">
          <div className="relative z-10 w-2/3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-md text-[9px] font-extrabold uppercase tracking-wider mb-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-300 fill-amber-300" /> Deal of the Day
            </span>
            <h2 className="text-base font-bold mb-0.5 leading-tight">UPSC Prelims Masterclass</h2>
            <p className="text-[11px] text-white/85 mb-2.5 line-clamp-2 leading-snug">
              Complete CSAT guide with 10 years solved papers and quantitative reasoning formulas.
            </p>
            <Link
              href="/book/upsc-prelims-csat"
              className="inline-block bg-white text-[#2053BA] px-3.5 py-1.5 rounded-full text-[11px] font-extrabold active:scale-95 transition-transform shadow-sm"
            >
              Get Now at ₹199
            </Link>
          </div>
          <div className="absolute right-[-10%] top-[-10%] w-28 h-28 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute right-[5%] bottom-[-20%] w-20 h-20 bg-black/10 rounded-full blur-lg"></div>
        </section>

        {/* Active Reading Rail */}
        <section aria-labelledby="heading-continue-reading">
          <div className="flex items-center justify-between mb-2">
            <h2 id="heading-continue-reading" className="text-xs font-extrabold text-gray-900 tracking-tight">
              Continue Reading
            </h2>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1.5 snap-x snap-mandatory no-scrollbar -mx-2.5 px-2.5">
            {books.slice(0, 3).map((book, idx) => (
              <Link
                key={book.id || idx}
                href={`/book/${book.seoslug}`}
                className="snap-start shrink-0 w-60 p-2.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2.5 hover:bg-gray-100/80 transition-colors"
              >
                <ProceduralCover title={book.title} className="w-9 shrink-0 shadow-sm" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-gray-900 truncate mb-1">{book.title}</h3>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                    <div
                      className="bg-[#53BA20] h-1.5 rounded-full"
                      style={{ width: `${((idx * 23) % 40) + 40}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] font-semibold text-gray-500">Page 42 of {book.pageCount || 150}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Crawlable Category Chips */}
        <section aria-labelledby="heading-categories">
          <div className="flex items-center justify-between mb-3">
            <h2 id="heading-categories" className="text-sm font-bold text-gray-900 tracking-tight">
              Top Exam Categories
            </h2>
            <Link href="/categories" className="text-xs font-bold text-[#2053BA] hover:underline">
              See All
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 10).map((cat, idx) => {
              const catSlug = cat.seoslug || slugify(cat.name);
              return (
                <Link
                  key={cat.id || idx}
                  href={`/categories/${catSlug}`}
                  className="px-3.5 py-1.5 bg-white border border-gray-200/90 rounded-full text-xs font-semibold text-gray-700 active:bg-gray-50 hover:border-[#2053BA]/30 hover:text-[#2053BA] transition-colors shadow-2xs"
                >
                  {cat.name}
                </Link>
              );
            })}
            <Link
              href="/categories"
              className="px-3 py-1.5 bg-[#2053BA]/5 border border-[#2053BA]/20 rounded-full text-xs font-bold text-[#2053BA] flex items-center gap-1 hover:bg-[#2053BA]/10 transition-colors"
            >
              Explore All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </section>

        {/* Featured Grid (Trending Books) */}
        <section aria-labelledby="heading-trending">
          <div className="flex items-center justify-between mb-3">
            <h2 id="heading-trending" className="text-sm font-bold text-gray-900 tracking-tight">
              Trending Books
            </h2>
            <Link href="/categories" className="text-xs font-bold text-[#2053BA] hover:underline">
              View Collection
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-x-2.5 gap-y-4">
            {books.slice(0, 8).map((book, idx) => (
              <BookCard key={book.id || idx} book={book} layout="grid" />
            ))}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-4 bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
          <h2 className="text-xs font-bold text-gray-900 mb-3 text-center uppercase tracking-wider">
            Why Aspirants Choose Exam Kart
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-[#53BA20]/10 flex items-center justify-center text-[#53BA20]">
                <Download className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold leading-tight text-gray-800">
                Instant PDF<br />Downloads
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-[#2053BA]/10 flex items-center justify-center text-[#2053BA]">
                <BookOpen className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold leading-tight text-gray-800">
                Native PDF<br />Reader
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-[#BA8720]/10 flex items-center justify-center text-[#BA8720]">
                <Shield className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold leading-tight text-gray-800">
                Verified<br />Solved Papers
              </p>
            </div>
          </div>
        </section>

        {/* New Arrivals List */}
        <section aria-labelledby="heading-new-arrivals">
          <div className="flex items-center justify-between mb-3">
            <h2 id="heading-new-arrivals" className="text-sm font-bold text-gray-900 tracking-tight">
              New Arrivals & Solved Question Banks
            </h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {books.slice(0, 10).map((book, idx) => (
              <BookCard key={book.id || idx} book={book} layout="list" />
            ))}
          </div>
        </section>

        {/* Footer & Quick Links */}
        <footer className="py-5 space-y-4 border-t border-gray-100">
          <div>
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
              Quick Links & Policies
            </h2>
            <p className="text-[11px] text-gray-500">Legal info, support, and contact for Exam Kart</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/privacy-policy"
              className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 flex flex-col justify-between hover:bg-gray-100/80 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#2053BA] mb-2" />
              <div>
                <h3 className="text-xs font-bold text-gray-900">Privacy Policy</h3>
                <p className="text-[10px] text-gray-500">Data protection guidelines</p>
              </div>
            </Link>

            <Link
              href="/terms-and-conditions"
              className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 flex flex-col justify-between hover:bg-gray-100/80 transition-colors"
            >
              <FileText className="w-4 h-4 text-[#2053BA] mb-2" />
              <div>
                <h3 className="text-xs font-bold text-gray-900">Terms & Conditions</h3>
                <p className="text-[10px] text-gray-500">User license agreement</p>
              </div>
            </Link>

            <Link
              href="/refund-and-cancellation"
              className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 flex flex-col justify-between hover:bg-gray-100/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-[#53BA20] mb-2" />
              <div>
                <h3 className="text-xs font-bold text-gray-900">Refund Policy</h3>
                <p className="text-[10px] text-gray-500">Returns & cancellations</p>
              </div>
            </Link>

            <Link
              href="/contact-us"
              className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 flex flex-col justify-between hover:bg-gray-100/80 transition-colors"
            >
              <Mail className="w-4 h-4 text-[#8720BA] mb-2" />
              <div>
                <h3 className="text-xs font-bold text-gray-900">Contact Us</h3>
                <p className="text-[10px] text-gray-500">Support & inquiries</p>
              </div>
            </Link>
          </div>

          <div className="p-3 bg-gray-50/60 rounded-2xl border border-gray-100 text-[11px] space-y-1.5 text-gray-700">
            <div>
              <span><strong>Legal Name:</strong> Pardeep Kumar</span>
              <span className="mx-1.5">|</span>
              <span><strong>Brand:</strong> Exam Kart</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#2053BA] shrink-0" />
              <span className="truncate">
                <strong>Email:</strong>{" "}
                <a href="mailto:support@exam-kart.com" className="text-[#2053BA] font-bold underline">
                  support@exam-kart.com
                </a>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#2053BA] shrink-0 mt-0.5" />
              <span><strong>Address:</strong> 282, Sector 4, Hisar Haryana 125001</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#2053BA] shrink-0" />
              <span className="truncate">
                <strong>Web:</strong>{" "}
                <a href="https://exam-kart.com/" target="_blank" rel="noreferrer" className="text-[#2053BA] font-bold underline">
                  https://exam-kart.com/
                </a>
              </span>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-400 font-medium pt-1">
            © 2026 Exam Kart. All rights reserved.
          </p>
        </footer>

      </div>
    </main>
  );
}
