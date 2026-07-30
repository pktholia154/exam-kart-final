"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, signInWithPopup, googleProvider, auth } from "@/lib/firebase";
import { BookOpen, Check, ShieldAlert, Loader2, CreditCard, Share2, CheckCheck, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Book } from "@/lib/books-store";

interface BookActionsProps {
  book: Book;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function BookActions({ book }: BookActionsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, items } = useCart();
  const [buying, setBuying] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const bookIdOrSlug = book.id || book.seoslug;
  const inCart = items.some(item => (item.book.id || item.book.seoslug) === bookIdOrSlug);

  useEffect(() => {
    let active = true;
    const checkPurchaseStatus = async () => {
      if (!user || !book?.id) {
        setHasPurchased(false);
        return;
      }
      setCheckingPurchase(true);
      try {
        const q = query(
          collection(db, "purchases"),
          where("userId", "==", user.uid),
          where("bookId", "==", book.id)
        );
        const querySnapshot = await getDocs(q);
        if (active) {
          setHasPurchased(!querySnapshot.empty);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "purchases");
      } finally {
        if (active) {
          setCheckingPurchase(false);
        }
      }
    };

    checkPurchaseStatus();
    return () => {
      active = false;
    };
  }, [user, book?.id, book?.seoslug]);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: book.title,
      text: book.seoDescription || `Check out ${book.title} on Exam Kart!`,
      url: url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User closed native share sheet
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.error("Clipboard copy error:", err);
      }
    }
  };

  // Dynamically load Razorpay checkout.js script if not present
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

  const handleBuy = async () => {
    setErrorMessage(null);

    // 1. Ensure User Authentication
    let currentUser = user;
    if (!currentUser) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        currentUser = result.user;
      } catch (authError: any) {
        console.error("Authentication failed:", authError);
        setErrorMessage("Please sign in with Google to purchase this e-book.");
        return;
      }
    }

    if (!currentUser) {
      setErrorMessage("Please sign in to proceed with payment.");
      return;
    }

    setBuying(true);

    try {
      // 2. Load Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMessage("Failed to load Razorpay payment gateway. Please check your internet connection.");
        setBuying(false);
        return;
      }

      // 3. Calculate amount in paise (Min 100 paise = ₹1)
      const priceNum = parseFloat(book.buyprice) || 99;
      const amountInPaise = Math.max(100, Math.round(priceNum * 100));

      // 4. Create Order on Backend
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: `rcpt_${book.seoslug.substring(0, 20)}_${Date.now()}`,
          notes: {
            bookId: book.id || book.seoslug,
            bookTitle: book.title,
            userId: currentUser.uid,
          },
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.order_id) {
        throw new Error(orderData.error || "Failed to initialize order with Razorpay.");
      }

      // 5. Open Razorpay Standard Checkout Modal
      let razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey || razorpayKey.includes("test")) {
        razorpayKey = "rzp_live_TJc8qwXIssrTXY";
      }

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Exam Kart",
        description: book.title,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // 6. Verify Payment Signature on Backend
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              // 7. Store purchase in Firestore
              await addDoc(collection(db, "purchases"), {
                userId: currentUser.uid,
                bookId: book.id || book.seoslug,
                title: book.title,
                seoslug: book.seoslug,
                category: book.category,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                pdfurl: book.pdfurl || "",
                purchasedAt: new Date().toISOString(),
              });

              setHasPurchased(true);
              router.push("/purchased");
            } else {
              setErrorMessage(
                verifyData.error || "Payment signature verification failed. Please contact support if debited."
              );
            }
          } catch (verifyErr: any) {
            console.error("Error verifying payment signature:", verifyErr);
            setErrorMessage("An error occurred while verifying your payment signature.");
          } finally {
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
            console.log("Razorpay payment modal closed by user.");
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", function (failResponse: any) {
        console.error("Razorpay payment failed:", failResponse.error);
        setBuying(false);
        setErrorMessage(
          failResponse.error?.description || "Payment failed. Please try again or use a different payment method."
        );
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error("Error during checkout:", err);
      setErrorMessage(err.message || "An unexpected error occurred during checkout.");
      setBuying(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-start gap-2 shadow-sm">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-600 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-2.5">
        {hasPurchased ? (
          <>
            <Link
              href={`/read/${bookIdOrSlug}?type=sample&url=${encodeURIComponent(
                book.sampleurl || book.pdfurl || ""
              )}`}
              className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white py-2.5 px-2 rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 ring-2 ring-emerald-400/40 animate-[pulse_2.5s_cubic-bezier(0.4,0,0.6,1)_infinite]"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Sample
            </Link>
            <Link
              href={`/read/${bookIdOrSlug}?type=full&url=${encodeURIComponent(
                book.pdfurl || book.sampleurl || ""
              )}`}
              className="flex-[1.5] bg-[#2053BA] text-white py-2.5 px-2 rounded-xl text-xs font-bold shadow-md shadow-[#2053BA]/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Purchased
            </Link>
          </>
        ) : (
          <>
            <Link
              href={`/read/${bookIdOrSlug}?type=sample&url=${encodeURIComponent(
                book.sampleurl || book.pdfurl || ""
              )}`}
              className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white py-2.5 px-2 rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 ring-2 ring-emerald-400/40 animate-[pulse_2.5s_cubic-bezier(0.4,0,0.6,1)_infinite]"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Sample
            </Link>
            <button
              onClick={handleBuy}
              disabled={buying || checkingPurchase}
              className="flex-[1.5] w-full bg-[#2053BA] hover:bg-[#301a9c] text-white py-2.5 px-2 rounded-xl text-xs font-bold shadow-md shadow-[#2053BA]/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-70 cursor-pointer"
            >
              {buying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  Buy Now • ₹{book.buyprice}
                </>
              )}
            </button>
          </>
        )}
      </div>

      {!hasPurchased && (
        <button
          onClick={() => addToCart(book)}
          disabled={inCart || checkingPurchase}
          className="w-full bg-orange-100 hover:bg-orange-200 text-orange-700 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm disabled:opacity-50"
        >
          {inCart ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added to Cart</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      )}

      {/* Prominent Share Button */}
      <button
        onClick={handleShare}
        className="w-full bg-[#2053BA]/10 hover:bg-[#2053BA]/15 text-[#2053BA] py-2.5 px-4 rounded-xl text-xs font-extrabold border border-[#2053BA]/25 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-2xs"
      >
        {copied ? (
          <>
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700">Link Copied to Clipboard!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4 text-[#2053BA]" />
            <span>Share E-Book</span>
          </>
        )}
      </button>
    </div>
  );
}
