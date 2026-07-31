"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db, signInWithPopup, googleProvider, auth } from "@/lib/firebase";
import { ShoppingCart, Loader2, CreditCard, Trash2, ArrowLeft, Gift, Wallet, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { ProceduralCover } from "@/components/ProceduralCover";
import { getReferralCodeCookie, deductWalletCredit, processReferralOrderReward } from "@/lib/referral-service";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CartPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { items, removeFromCart, clearCart, totalPrice, totalItems } = useCart();
  const [buying, setBuying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [useWalletCredit, setUseWalletCredit] = useState(true);
  const [appliedReferralCode, setAppliedReferralCode] = useState<string | null>(null);
  const [isFirstPurchase, setIsFirstPurchase] = useState(true);

  // Read referral code from cookie/profile
  useEffect(() => {
    const code = getReferralCodeCookie() || profile?.referred_by_code;
    if (code) {
      // eslint-disable-next-line
      setAppliedReferralCode(code.toUpperCase());
    }
  }, [profile]);

  // Check if user has past purchases
  useEffect(() => {
    async function checkPurchases() {
      if (!user) return;
      try {
        const q = query(collection(db, "purchases"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setIsFirstPurchase(false);
        }
      } catch (err) {
        console.warn("Error checking past purchases:", err);
      }
    }
    checkPurchases();
  }, [user]);

  // 15% referral discount if referral code present and it's 1st purchase
  const referralDiscountRate = (appliedReferralCode && isFirstPurchase) ? 0.15 : 0;
  const referralDiscountAmount = totalPrice * referralDiscountRate;
  const payableAfterDiscount = Math.max(0, totalPrice - referralDiscountAmount);

  // Store credit calculation
  const walletBalance = profile?.wallet_balance || 0;
  const walletCreditToUse = (useWalletCredit && walletBalance > 0) 
    ? Math.min(walletBalance, payableAfterDiscount) 
    : 0;

  const finalPayableTotal = Math.max(0, payableAfterDiscount - walletCreditToUse);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCompleteOrderSuccess = async (orderId: string, paymentId: string, amountPaidInPaise: number) => {
    if (!user) return;
    
    // 1. Add all books to purchased
    const promises = items.map(item => 
      addDoc(collection(db, "purchases"), {
        userId: user.uid,
        bookId: item.book.id || item.book.seoslug,
        title: item.book.title,
        seoslug: item.book.seoslug,
        category: item.book.category,
        orderId,
        paymentId,
        pdfurl: item.book.pdfurl || "",
        purchasedAt: new Date().toISOString(),
      })
    );
    await Promise.all(promises);

    // 2. Deduct wallet balance if used
    if (walletCreditToUse > 0) {
      await deductWalletCredit({
        userId: user.uid,
        amountToDeduct: walletCreditToUse,
        orderId,
      });
    }

    // 3. Process referral reward for the referrer (20% store credit, 7-day unlock)
    const netPaidAmountInINR = amountPaidInPaise / 100;
    await processReferralOrderReward({
      buyerUserId: user.uid,
      orderId,
      netPaidAmount: netPaidAmountInINR,
    });

    await refreshProfile();
    clearCart();
    setSuccessMessage("🎉 Order successful! Check your profile and library.");
    setTimeout(() => {
      router.push("/purchased");
    }, 1500);
  };

  const handleCheckout = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    let currentUser = user;
    if (!currentUser) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        currentUser = result.user;
      } catch (authError: any) {
        console.error("Authentication failed:", authError);
        setErrorMessage("Please sign in with Google to checkout.");
        return;
      }
    }

    if (!currentUser) {
      setErrorMessage("Please sign in to proceed with payment.");
      return;
    }

    setBuying(true);

    try {
      // If final payable total is 0 (covered completely by store credit)
      if (finalPayableTotal === 0 && walletCreditToUse > 0) {
        const fullCreditOrderId = `credit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await handleCompleteOrderSuccess(fullCreditOrderId, "STORE_CREDIT_PAYMENT", 0);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMessage("Failed to load Razorpay payment gateway.");
        setBuying(false);
        return;
      }

      const amountInPaise = Math.max(100, Math.round(finalPayableTotal * 100));
      const bookIds = items.map(i => i.book.id || i.book.seoslug).join(",");

      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: `cart_${Date.now()}`,
          notes: {
            bookIds,
            userId: currentUser.uid,
            referralCode: appliedReferralCode || "",
            walletCreditUsed: walletCreditToUse,
          },
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.order_id) {
        throw new Error(orderData.error || "Failed to initialize order with Razorpay.");
      }

      let razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_TJc8qwXIssrTXY";

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Exam Kart",
        description: `Checkout ${totalItems} books`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              await handleCompleteOrderSuccess(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                orderData.amount
              );
            } else {
              setErrorMessage(verifyData.error || "Payment signature verification failed.");
              setBuying(false);
            }
          } catch (verifyErr: any) {
            console.error("Error verifying payment signature:", verifyErr);
            setErrorMessage("An error occurred while verifying your payment signature.");
            setBuying(false);
          }
        },
        prefill: {
          name: currentUser.displayName || "Student",
          email: currentUser.email || "",
        },
        theme: {
          color: "#2053BA",
        },
        modal: {
          ondismiss: function () {
            setBuying(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (failResponse: any) {
        setBuying(false);
        setErrorMessage(failResponse.error?.description || "Payment failed.");
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error("Error during checkout:", err);
      setErrorMessage(err.message || "An unexpected error occurred during checkout.");
      setBuying(false);
    }
  };

  return (
    <main className="min-h-screen pt-4 pb-24 max-w-md md:max-w-2xl mx-auto px-4 bg-white">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 bg-gray-50 rounded-full">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-black text-gray-900 tracking-tight">Your Cart</h1>
      </div>

      {errorMessage && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold mb-4 border border-red-100">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 text-green-700 p-3 rounded-xl text-xs font-bold mb-4 border border-green-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" /> {successMessage}
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
          <h2 className="text-sm font-bold text-gray-800">Your cart is empty</h2>
          <p className="text-xs text-gray-500 mt-1 mb-6">Looks like you haven&apos;t added any books yet.</p>
          <Link href="/" className="bg-[#2053BA] text-white px-5 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform">
            Start Exploring
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Referral Banner in Cart */}
          {appliedReferralCode && isFirstPurchase && (
            <div className="bg-purple-50 text-purple-900 p-3.5 rounded-2xl flex items-center justify-between border border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-600 block">
                    Referral Discount Applied!
                  </span>
                  <p className="text-xs font-black">
                    15% OFF from code <span className="underline">{appliedReferralCode}</span>
                  </p>
                </div>
              </div>
              <span className="text-xs font-extrabold bg-purple-100 px-2 py-1 rounded-lg">
                -₹{referralDiscountAmount.toFixed(2)}
              </span>
            </div>
          )}

          {/* Cart items list */}
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.book.id || item.book.seoslug} className="py-4 flex gap-4 items-start">
                <ProceduralCover title={item.book.title} className="w-16 rounded shadow-sm shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                  <div>
                    <h3 className="text-[13px] font-bold text-gray-900 leading-tight mb-1">{item.book.title}</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-1">{item.book.publisher}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-[#2053BA] text-sm">₹{item.book.buyprice}</span>
                    <button 
                      onClick={() => removeFromCart(item.book.id || item.book.seoslug)}
                      className="text-red-500 bg-red-50 p-1.5 rounded-lg active:scale-95 transition-transform"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Store Credit Option */}
          {walletBalance > 0 && (
            <div className="bg-amber-50 rounded-2xl p-4 flex items-center justify-between border border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[11px] font-extrabold text-amber-900">Use Store Credit</h4>
                    <span className="text-[9px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                      ₹{walletBalance.toFixed(2)} available
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-700">Apply credit earned from referring friends</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWalletCredit}
                  onChange={(e) => setUseWalletCredit(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2053BA]"></div>
              </label>
            </div>
          )}

          {/* Bill Summary */}
          <div className="pt-2">
            <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">Order Summary</h3>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">Subtotal ({totalItems} items)</span>
              <span className="text-xs font-bold text-gray-900">₹{totalPrice.toFixed(2)}</span>
            </div>

            {referralDiscountAmount > 0 && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-green-700 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5" /> Referral Discount (15%)
                </span>
                <span className="text-xs font-bold text-green-600">-₹{referralDiscountAmount.toFixed(2)}</span>
              </div>
            )}

            {walletCreditToUse > 0 && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-amber-700 flex items-center gap-1 font-medium">
                  <Wallet className="w-3.5 h-3.5" /> Store Credit Applied
                </span>
                <span className="text-xs font-bold text-amber-600">-₹{walletCreditToUse.toFixed(2)}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2 mb-6">
              <div>
                <span className="text-sm font-black text-gray-900 block">Total Payable</span>
                {appliedReferralCode && (
                  <span className="text-[10px] text-gray-400">Referral reward will unlock for referrer in 7 days</span>
                )}
              </div>
              <span className="text-lg font-black text-[#2053BA]">₹{finalPayableTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={buying}
              className="w-full bg-[#2053BA] text-white py-3 rounded-xl text-xs font-bold active:scale-[0.98] transition-transform shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {buying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing Order...
                </>
              ) : finalPayableTotal === 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Place Order with Store Credit (₹0)
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" /> Checkout Securely
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

