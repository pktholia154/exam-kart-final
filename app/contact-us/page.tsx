import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, ChevronRight } from "lucide-react";
import { SITE_URL } from "@/lib/books-server";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us | Exam Kart Support & Inquiries",
  description: "Contact Exam Kart support team for questions regarding e-books, order support, or competitive exam preparation materials.",
  alternates: {
    canonical: `${SITE_URL}/contact-us`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactUsPage() {
  const jsonLdContact = {
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
        name: "Contact Us",
        item: `${SITE_URL}/contact-us`,
      },
    ],
  };

  return (
    <main className="min-h-screen pt-4 pb-12 max-w-md md:max-w-2xl mx-auto px-4 bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdContact) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-3 text-[11px] text-gray-500 font-medium">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
          </li>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <li className="text-gray-900 font-bold" aria-current="page">
            Contact Us
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
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Contact Us</h1>
          <p className="text-[11px] text-gray-500 font-medium">We are here to help you</p>
        </div>
      </div>

      {/* Hero Badge */}
      <div className="bg-gradient-to-br from-[#2053BA] to-[#2053BA] rounded-3xl p-5 text-white shadow-md mb-6 relative overflow-hidden">
        <div className="relative z-10 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold mb-1">Get in Touch with Exam Kart</h2>
            <p className="text-xs text-white/80 leading-relaxed">
              Have questions regarding e-books, order support, or competitive exam preparation materials? Reach out to our team.
            </p>
          </div>
        </div>
      </div>

      <ContactForm />
    </main>
  );
}
