"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { collection, addDoc } from "firebase/firestore";
import { db, signInWithPopup, googleProvider, auth } from "@/lib/firebase";
import { ShoppingCart, Loader2, CreditCard, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProceduralCover } from "@/components/ProceduralCover";
import Image from "next/image";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, removeFromCart, clearCart, totalPrice, totalItems } = useCart();
  const [buying, setBuying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleCheckout = async () => {
    setErrorMessage(null);

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
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMessage("Failed to load Razorpay payment gateway.");
        setBuying(false);
        return;
      }

      const amountInPaise = Math.max(100, Math.round(totalPrice * 100));
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
              // Add all books to purchased
              const promises = items.map(item => 
                addDoc(collection(db, "purchases"), {
                  userId: currentUser.uid,
                  bookId: item.book.id || item.book.seoslug,
                  title: item.book.title,
                  seoslug: item.book.seoslug,
                  category: item.book.category,
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  pdfurl: item.book.pdfurl || "",
                  purchasedAt: new Date().toISOString(),
                })
              );

              await Promise.all(promises);

              clearCart();
              router.push("/purchased");
            } else {
              setErrorMessage(verifyData.error || "Payment signature verification failed.");
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
    <main className="min-h-screen pt-4 pb-24 max-w-md md:max-w-2xl mx-auto px-4 bg-gray-50">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Your Cart</h1>
      </div>

      {errorMessage && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold mb-4 border border-red-100">
          {errorMessage}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center text-center">
          <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
          <h2 className="text-sm font-bold text-gray-800">Your cart is empty</h2>
          <p className="text-xs text-gray-500 mt-1 mb-6">Looks like you haven&apos;t added any books yet.</p>
          <Link href="/" className="bg-[#2053BA] text-white px-5 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform">
            Start Exploring
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {items.map((item) => (
              <div key={item.book.id || item.book.seoslug} className="p-4 flex gap-4 items-start">
                <ProceduralCover title={item.book.title} className="w-16 rounded shadow-sm shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1">{item.book.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{item.book.publisher}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-[#2053BA]">₹{item.book.buyprice}</span>
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

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Subtotal ({totalItems} items)</span>
              <span className="text-sm font-bold text-gray-900">₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <span className="text-sm text-gray-600">Discount</span>
              <span className="text-sm font-bold text-green-600">-₹0.00</span>
            </div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-base font-black text-gray-900">Total</span>
              <span className="text-xl font-black text-[#2053BA]">₹{totalPrice.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={buying}
              className="w-full bg-[#2053BA] text-white py-3.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform shadow-md shadow-[#2053BA]/20 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {buying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
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
