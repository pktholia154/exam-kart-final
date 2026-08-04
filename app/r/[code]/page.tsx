"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { setReferralCodeCookie } from "@/lib/referral-service";
import { Gift, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

interface ReferralPageProps {
  params: Promise<{ code: string }>;
}

export default function ReferralLandingPage({ params }: ReferralPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const code = resolvedParams.code.toUpperCase();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (code) {
      setReferralCodeCookie(code);
    }
  }, [code]);

  return (
    <main className="min-h-screen pt-12 pb-20 max-w-md md:max-w-xl mx-auto px-4 flex flex-col items-center justify-center text-center bg-gray-50">
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 w-full space-y-6 relative overflow-hidden">
        {/* Background glow decorative */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2053BA]/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#8720BA]/10 rounded-full blur-2xl" />

        <div className="w-16 h-16 bg-gradient-to-tr from-[#2053BA] to-[#8720BA] text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#2053BA]/20">
          <Gift className="w-8 h-8" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.6111rem] font-extrabold bg-green-50 text-green-700 border border-green-200 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> 15% Special Discount Unlocked!
          </span>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-snug">
            You received 15% off from <span className="text-[#2053BA]">{code}</span>!
          </h1>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            Your friend shared their exclusive referral discount with you. Enjoy 15% off your first competitive exam e-book purchase on Exam Kart!
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 flex items-center justify-between text-left">
          <div>
            <span className="text-[0.5556rem] font-bold text-gray-400 uppercase tracking-wider block">Applied Referral Code</span>
            <span className="text-sm font-extrabold text-gray-900 tracking-wider">{code}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-100/80 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-4 h-4" /> 15% OFF Active
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href="/"
            className="w-full bg-[#2053BA] text-white py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-md shadow-[#2053BA]/20 active:scale-[0.98] transition-transform"
          >
            Explore E-Books Now <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/cart"
            className="w-full bg-white text-gray-800 border border-gray-200 py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            Go to Cart & Checkout
          </Link>
        </div>

        <p className="text-[0.5556rem] text-gray-400 italic">
          *Discount will auto-apply at checkout. Valid for 30 days on your first purchase.
        </p>
      </div>
    </main>
  );
}
