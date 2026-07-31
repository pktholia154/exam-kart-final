"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { signInWithPopup, googleProvider, auth, signOut, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ReferralRecord, WalletTransaction } from "@/lib/referral-service";
import { 
  Gift, 
  Copy, 
  Check, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Info,
  LogOut,
  Users,
  Share2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Mail,
  Send
} from "lucide-react";

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const fetchReferralData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const refsQuery = query(
        collection(db, "referrals"),
        where("referrer_user_id", "==", user.uid)
      );
      const refsSnap = await getDocs(refsQuery);
      const refsList: ReferralRecord[] = [];
      refsSnap.forEach((doc) => {
        refsList.push({ id: doc.id, ...doc.data() } as ReferralRecord);
      });
      refsList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReferrals(refsList);

      const txQuery = query(
        collection(db, "wallet_transactions"),
        where("user_id", "==", user.uid)
      );
      const txSnap = await getDocs(txQuery);
      const txList: WalletTransaction[] = [];
      txSnap.forEach((doc) => {
        txList.push({ id: doc.id, ...doc.data() } as WalletTransaction);
      });
      txList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(txList);
    } catch (err) {
      console.warn("Error fetching referral dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchReferralData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) {
    return (
      <main className="min-h-screen pt-20 pb-16 max-w-xl mx-auto px-3 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#2053BA] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen pt-20 pb-12 max-w-sm mx-auto px-4 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 bg-gradient-to-tr from-[#2053BA]/15 to-[#8720BA]/15 text-[#2053BA] rounded-2xl flex items-center justify-center mb-4 shadow-inner">
          <Gift className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight mb-1">Sign in to Exam Kart</h1>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed max-w-xs">
          Access your referral link, store credit balance, and track purchases seamlessly.
        </p>
        <button 
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="w-full py-2.5 px-4 bg-white border border-gray-900 hover:bg-gray-50 text-gray-900 rounded-full text-xs font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-xs"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
      </main>
    );
  }

  const referralCode = profile?.referral_code || "EXAM42";
  const referralLink = `https://exam-kart.com/r/${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = `Enjoyed reading exam e-books? Get 15% off your first ebook purchase on Exam Kart using my referral link!`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent("Get 15% off e-books on Exam Kart")}&body=${encodeURIComponent(`${shareText}\n\nClick here: ${referralLink}`)}`;

  const walletBalance = profile?.wallet_balance || 0;
  const successfulCount = referrals.filter((r) => r.status === "rewarded").length;
  const pendingCount = referrals.filter((r) => r.status === "pending").length;

  return (
    <main className="min-h-screen pt-4 sm:pt-6 pb-20 max-w-xl mx-auto px-2.5 sm:px-4 bg-white space-y-4 text-gray-900 text-xs">
      
      {/* 1. Header & Identity (Compact High Density) */}
      <div className="flex items-center justify-between py-2 border-b border-gray-100 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-tr from-[#2053BA] to-[#8720BA] text-white text-xs font-black rounded-full flex items-center justify-center shrink-0 shadow-xs">
            {user.displayName?.[0] || "U"}
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 truncate leading-tight">{user.displayName}</h1>
            <p className="text-[11px] text-gray-500 truncate leading-tight">{user.email}</p>
          </div>
        </div>

        <button 
          onClick={() => signOut(auth)}
          className="px-3 py-1.5 rounded-full border border-gray-900 bg-white hover:bg-gray-50 text-gray-900 text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 active:scale-95"
          title="Sign Out"
        >
          <LogOut className="w-3 h-3" /> Sign Out
        </button>
      </div>

      {/* 2. Program Banner & Wallet Balance Bar */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#2053BA]">Refer & Earn Program</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-300 text-emerald-800">
            <Wallet className="w-3 h-3 text-emerald-700" />
            <span className="text-[11px] font-extrabold">Store Credit:</span>
            <span className="text-xs font-black text-emerald-900">₹{walletBalance.toFixed(0)}</span>
          </div>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-snug">
            Share 15% Off, Earn 20% Store Credit
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
            Give friends 15% off their first competitive exam ebook. You earn 20% in store credit on their purchase.
          </p>
        </div>

        {/* Action Buttons styled like provided image (Pill with crisp black/colored border, explicit icon + label) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 pl-3 rounded-full border border-gray-900 focus-within:border-[#2053BA] transition-all">
            <input 
              type="text" 
              readOnly 
              value={referralLink}
              className="flex-1 bg-transparent text-gray-900 text-[11px] font-mono outline-none truncate"
            />
            {/* Green Pill Button (Matching Green Sample button from screenshot) */}
            <button
              onClick={copyToClipboard}
              className="bg-[#48A36D] hover:bg-[#3D8F5E] text-white px-3.5 py-1.5 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-200" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy Link
                </>
              )}
            </button>
          </div>

          {/* Quick Share Action Buttons matching exact outlined style from screenshot */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 bg-white border border-gray-900 hover:bg-gray-50 text-gray-900 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5 text-[#25D366]" /> Share WhatsApp
            </a>
            <a
              href={emailUrl}
              className="py-2 px-3 bg-white border border-gray-900 hover:bg-gray-50 text-gray-900 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Mail className="w-3.5 h-3.5 text-gray-700" /> Email Invite
            </a>
          </div>
        </div>
      </div>

      {/* 3. Inline Metrics Bar */}
      <div className="py-2.5 my-1 border-y border-gray-100 grid grid-cols-3 gap-1 text-center bg-gray-50/50 rounded-xl">
        <div className="space-y-0">
          <span className="text-base sm:text-lg font-black text-gray-900 block leading-tight">₹{walletBalance.toFixed(0)}</span>
          <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-tight">Available Credit</span>
        </div>
        <div className="space-y-0 border-x border-gray-200">
          <span className="text-base sm:text-lg font-black text-emerald-600 block leading-tight">{successfulCount}</span>
          <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-tight">Successful</span>
        </div>
        <div className="space-y-0">
          <span className="text-base sm:text-lg font-black text-amber-500 block leading-tight">{pendingCount}</span>
          <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-tight">Pending (7d)</span>
        </div>
      </div>

      {/* 4. Referral Activity History */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#2053BA]" />
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Referral Activity</h3>
          </div>
          <button 
            onClick={fetchReferralData} 
            className="text-[11px] font-bold text-[#2053BA] hover:text-[#1a449b] flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loadingData ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {referrals.length === 0 ? (
          <div className="py-4 text-center text-gray-400 space-y-0.5 bg-gray-50/40 rounded-xl border border-dashed border-gray-200">
            <p className="text-[11px] font-bold text-gray-600">No referral activity recorded yet.</p>
            <p className="text-[10px]">Share your link above to start earning store credit!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {referrals.map((refItem) => (
              <div key={refItem.id} className="py-2 flex items-center justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-gray-900 truncate">
                      Friend ({refItem.referred_user_id.substring(0, 8)})
                    </span>
                    {refItem.status === "rewarded" && (
                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200 inline-flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Rewarded
                      </span>
                    )}
                    {refItem.status === "pending" && (
                      <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200 inline-flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 text-amber-600" /> Pending (7d)
                      </span>
                    )}
                    {refItem.status === "signed_up" && (
                      <span className="text-[9px] font-black text-[#2053BA] bg-blue-50 px-1.5 py-0.2 rounded-full border border-blue-200">
                        Signed Up
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {new Date(refItem.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {refItem.reward_available_at && refItem.status === "pending" && (
                      <span> · Unlocks {new Date(refItem.reward_available_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    )}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {refItem.reward_amount ? (
                    <span className="text-[11px] font-black text-emerald-600">+₹{refItem.reward_amount}</span>
                  ) : (
                    <span className="text-[10px] font-medium text-gray-400">Awaiting Order</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Wallet Ledger History */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-[#2053BA]" />
          <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Wallet Ledger History</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="py-4 text-center text-gray-400 space-y-0.5 bg-gray-50/40 rounded-xl border border-dashed border-gray-200">
            <p className="text-[11px] font-bold text-gray-600">No credit transactions yet.</p>
            <p className="text-[10px]">Credits earned from referrals or spent on e-books appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-gray-200 ${
                    tx.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-700"
                  }`}>
                    {tx.amount > 0 ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-900 truncate leading-tight">{tx.description}</p>
                    <span className="text-[10px] text-gray-400 leading-tight block">
                      {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <span className={`text-[11px] font-black shrink-0 ${
                  tx.amount > 0 ? "text-emerald-600" : "text-gray-900"
                }`}>
                  {tx.amount > 0 ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Program Rules Accordion */}
      <div className="pt-3 border-t border-gray-100">
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full flex items-center justify-between text-[11px] font-extrabold text-gray-600 uppercase tracking-wider py-1.5 hover:text-gray-900 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#2053BA]" /> Program Rules & Details
          </span>
          {showRules ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showRules && (
          <div className="mt-2 text-[11px] text-gray-600 space-y-1.5 leading-relaxed bg-gray-50/80 p-3 rounded-xl border border-gray-200">
            <p><strong className="text-gray-900">1. Referral Discount:</strong> Referred friends receive 15% off their first competitive exam e-book purchase on Exam Kart when using your unique link.</p>
            <p><strong className="text-gray-900">2. Store Credit:</strong> You earn 20% of their net order value as wallet credit, capped at ₹300 per referral.</p>
            <p><strong className="text-gray-900">3. 7-Day Hold:</strong> Referral rewards enter a 7-day validation period before becoming unlocked and available in your wallet.</p>
            <p><strong className="text-gray-900">4. Usage & Limits:</strong> Minimum order threshold of ₹100 applies. Maximum of 5 rewarded referrals per calendar month.</p>
          </div>
        )}
      </div>

    </main>
  );
}

