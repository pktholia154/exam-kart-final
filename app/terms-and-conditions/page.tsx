import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, Mail, MapPin, Globe, ChevronRight } from "lucide-react";
import { SITE_URL } from "@/lib/books-server";

export const metadata: Metadata = {
  title: "Terms & Conditions | Exam Kart E-Book Store",
  description: "Review the terms and conditions for purchasing competitive exam e-books on Exam Kart.",
  alternates: {
    canonical: `${SITE_URL}/terms-and-conditions`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsAndConditionsPage() {
  const jsonLdTerms = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
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
        name: "Terms and Conditions",
        item: `${SITE_URL}/terms-and-conditions`,
      },
    ],
  };

  return (
    <main className="min-h-screen pt-4 pb-12 max-w-md mx-auto px-4 bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdTerms) }}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-3 text-[11px] text-gray-500 font-medium">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
          </li>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <li className="text-gray-900 font-bold" aria-current="page">
            Terms & Conditions
          </li>
        </ol>
      </nav>

      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-5">
        <Link 
          href="/" 
          className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Terms & Conditions</h1>
          <p className="text-[11px] text-gray-500 font-medium">Last updated: July 2026</p>
        </div>
      </div>

      {/* Hero Badge */}
      <div className="bg-gradient-to-br from-[#3A20BA] to-[#2053BA] rounded-3xl p-5 text-white shadow-md mb-6 relative overflow-hidden">
        <div className="relative z-10 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold mb-1">Terms of Service</h2>
            <p className="text-xs text-white/80 leading-relaxed">
              Please review the terms governing your use of Exam Kart platform and digital e-book purchases.
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-6 text-xs text-gray-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">1. Agreement to Terms</h2>
          <p>
            By accessing <a href="https://exam-kart.com/" target="_blank" rel="noreferrer" className="text-[#3A20BA] underline font-semibold">https://exam-kart.com/</a> or using our web application provided by brand <strong>Exam Kart</strong> (Legal Name: <strong>Pardeep Kumar</strong>), you agree to be bound by these Terms and Conditions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">2. Digital Product License</h2>
          <p>
            All e-books, competitive exam study materials, CSAT guides, and mock papers purchased on Exam Kart are granted under a personal, non-exclusive, non-transferable license. You may download and view materials on your personal devices for individual study.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">3. Intellectual Property Rights</h2>
          <p>
            All content, procedural book covers, graphics, layout, software code, and educational content on this platform belong to Exam Kart.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">4. Prohibited Activities</h2>
          <p>Users are strictly prohibited from:</p>
          <ul className="list-disc pl-4 space-y-1 text-gray-600">
            <li>Redistributing, selling, renting, or broadcasting purchased PDF e-books to third parties.</li>
            <li>Attempting to bypass security mechanisms or scrape application content.</li>
            <li>Using the service for illegal or unauthorized educational resale.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">5. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. Exam Kart is not liable for losses caused by unauthorized account access resulting from user negligence.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">6. Disclaimers & Governing Law</h2>
          <p>
            Our materials are designed for competitive exam preparation. Exam Kart makes reasonable efforts to ensure accuracy. These terms are governed by the laws of India, with jurisdiction in Bhiwani, Haryana.
          </p>
        </section>

        <section className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">7. Contact Information</h2>
          <p>For questions regarding these terms, please contact us:</p>

          <div className="bg-[#F5F5F7] p-3 rounded-2xl space-y-2 text-[11px] font-medium text-gray-800">
            <div>
              <span><strong>Legal Name:</strong> Pardeep Kumar</span>
            </div>
            <div>
              <span><strong>Brand Name:</strong> Exam Kart</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#3A20BA] shrink-0" />
              <span>Email: <a href="mailto:support@exam-kart.com" className="text-[#3A20BA] font-bold underline">support@exam-kart.com</a></span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#3A20BA] shrink-0 mt-0.5" />
              <span>Address: 1st Floor, SCO-28, Sector 13, Bhiwani, Haryana 127021</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#3A20BA] shrink-0" />
              <span>Web: <a href="https://exam-kart.com/" target="_blank" rel="noreferrer" className="text-[#3A20BA] font-bold underline">https://exam-kart.com/</a></span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
