"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Mail, MapPin, Globe } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen pt-4 pb-12 max-w-md mx-auto px-4">
      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-6">
        <Link 
          href="/" 
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Privacy Policy</h1>
          <p className="text-[11px] text-gray-500 font-medium">Last updated: July 2026</p>
        </div>
      </div>

      {/* Hero Badge */}
      <div className="bg-gradient-to-br from-[#3A20BA] to-[#2053BA] rounded-3xl p-5 text-white shadow-md mb-6 relative overflow-hidden">
        <div className="relative z-10 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold mb-1">Your Privacy Matters</h2>
            <p className="text-xs text-white/80 leading-relaxed">
              At <strong>Exam Kart</strong> (Legal entity: <strong>Pardeep Kumar</strong>), we prioritize protecting your personal information and ensuring full transparency regarding data collection and usage.
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-6 text-xs text-gray-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">1. Overview & Information We Collect</h2>
          <p>
            When you visit or purchase digital e-books on <a href="https://exam-kart.com/" target="_blank" rel="noreferrer" className="text-[#3A20BA] underline font-semibold">https://exam-kart.com/</a>, we collect essential information required to deliver services effectively:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-gray-600">
            <li><strong>Personal Data:</strong> Name, email address, and authentication credentials (when signing in).</li>
            <li><strong>Transaction Records:</strong> History of purchased e-books, order IDs, and payment statuses.</li>
            <li><strong>Technical & App Data:</strong> Device type, browser preferences, and local reading progress stored on your device.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">2. How We Use Your Data</h2>
          <p>Your information is exclusively utilized for the following purposes:</p>
          <ul className="list-disc pl-4 space-y-1 text-gray-600">
            <li>Granting instant, secure access to purchased PDF e-books in your personal digital library.</li>
            <li>Preserving reading markers, notes, and offline download progress within the application.</li>
            <li>Processing orders and delivering customer support for exam material inquiries.</li>
            <li>Sending essential service updates, receipt confirmations, and referral reward updates.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">3. Data Security & Storage</h2>
          <p>
            We deploy strict security protocols including SSL encryption for data transmission and secure cloud infrastructure. Your purchased e-book library is linked to your authorized credentials to prevent unauthorized access.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">4. Third-Party Services</h2>
          <p>
            We do not sell, rent, or trade your personal data. Third-party integrations (such as secure authentication and payment processing channels) handle data strictly under confidentiality agreements to complete authorized transactions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">5. Cookies & Local Storage</h2>
          <p>
            Our web application uses client-side local storage and essential browser cookies to ensure uninterrupted offline access to your downloaded e-books and maintain seamless login sessions.
          </p>
        </section>

        <section className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">6. Contact & Data Inquiries</h2>
          <p>If you have questions or wish to request data updates/deletion, contact us at:</p>

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
              <span>Address: 282, Sector 4, Hisar Haryana 125001</span>
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
