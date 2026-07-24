"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw, Mail, MapPin, Globe, CheckCircle2 } from "lucide-react";

export default function RefundAndCancellationPage() {
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
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Refund Policy</h1>
          <p className="text-[11px] text-gray-500 font-medium font-sans">Refund & Cancellation Policy</p>
        </div>
      </div>

      {/* Hero Badge */}
      <div className="bg-gradient-to-br from-[#3A20BA] to-[#2053BA] rounded-3xl p-5 text-white shadow-md mb-6 relative overflow-hidden">
        <div className="relative z-10 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold mb-1">Fair & Transparent Refunds</h2>
            <p className="text-xs text-white/80 leading-relaxed">
              Clear guidelines on cancellations, digital download delivery, and eligible refund requests for Exam Kart purchases.
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-6 text-xs text-gray-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">1. Nature of Digital E-Books</h2>
          <p>
            All products offered on Exam Kart (<a href="https://exam-kart.com/" target="_blank" rel="noreferrer" className="text-[#3A20BA] underline font-semibold">https://exam-kart.com/</a>) are instant digital PDF downloads and e-books. Once an e-book is purchased, digital access is immediately unlocked and synced to your library.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">2. Order Cancellation Policy</h2>
          <p>
            Due to the immediate digital fulfillment nature of digital PDF materials, orders cannot be cancelled once payment is processed and the book has been added to your purchased library.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">3. Eligible Refund Scenarios</h2>
          <p>We provide full refunds under the following specific circumstances:</p>
          <div className="space-y-2 mt-2">
            <div className="p-3 bg-[#53BA20]/10 border border-[#53BA20]/20 rounded-2xl flex items-start gap-2 text-gray-800">
              <CheckCircle2 className="w-4 h-4 text-[#53BA20] shrink-0 mt-0.5" />
              <div>
                <strong>Duplicate Purchases:</strong> Accidental double payment for the exact same e-book within a 24-hour period.
              </div>
            </div>
            <div className="p-3 bg-[#53BA20]/10 border border-[#53BA20]/20 rounded-2xl flex items-start gap-2 text-gray-800">
              <CheckCircle2 className="w-4 h-4 text-[#53BA20] shrink-0 mt-0.5" />
              <div>
                <strong>Corrupted File / Technical Issue:</strong> Severe file damage or technical failure preventing reading, where our support team cannot provide a corrected copy within 48 hours.
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">4. How to Request a Refund</h2>
          <p>To initiate a refund request, follow these steps:</p>

          <ol className="list-decimal pl-4 space-y-1.5 text-gray-600">
            <li>Send an email to <a href="mailto:pardeep1984@gmail.com" className="text-[#3A20BA] font-bold underline">pardeep1984@gmail.com</a> within <strong>7 days</strong> of purchase.</li>
            <li>Include your registered email ID, transaction reference number, and book title.</li>
            <li>Provide a brief description or screenshot of the issue faced.</li>
          </ol>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">5. Processing Timelines</h2>
          <p>
            Once approved, refunds are credited back to the original payment method (bank account, UPI, credit/debit card) within <strong>5 to 7 business days</strong>.
          </p>
        </section>

        <section className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">6. Contact for Refund Inquiries</h2>

          <div className="bg-[#F5F5F7] p-3 rounded-2xl space-y-2 text-[11px] font-medium text-gray-800">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#3A20BA] shrink-0" />
              <span>Email: <a href="mailto:pardeep1984@gmail.com" className="text-[#3A20BA] font-bold underline">pardeep1984@gmail.com</a></span>
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
