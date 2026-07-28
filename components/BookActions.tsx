"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { BookOpen, Check } from "lucide-react";
import Link from "next/link";
import { Book } from "@/lib/books-store";

interface BookActionsProps {
  book: Book;
}

export function BookActions({ book }: BookActionsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [buying, setBuying] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  const bookIdOrSlug = book.id || book.seoslug;

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

  const handleBuy = async () => {
    if (!user) {
      router.push("/purchased");
      return;
    }
    setBuying(true);
    try {
      await addDoc(collection(db, "purchases"), {
        userId: user.uid,
        bookId: book.id || book.seoslug,
        title: book.title,
        seoslug: book.seoslug,
        category: book.category,
        purchasedAt: new Date().toISOString(),
      });
      setHasPurchased(true);
      router.push("/purchased");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "purchases");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="flex gap-3">
      {hasPurchased ? (
        <>
          <Link
            href={`/read/${bookIdOrSlug}?type=full&url=${encodeURIComponent(
              book.pdfurl || book.sampleurl || ""
            )}`}
            className="flex-1 bg-white text-[#3A20BA] py-2.5 px-2 rounded-xl text-xs font-bold border border-[#3A20BA]/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5 shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Sample
          </Link>
          <Link
            href={`/read/${bookIdOrSlug}?type=full&url=${encodeURIComponent(
              book.pdfurl || book.sampleurl || ""
            )}`}
            className="flex-[1.5] bg-[#53BA20] text-white py-2.5 px-2 rounded-xl text-xs font-bold shadow-md shadow-[#53BA20]/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
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
            className="flex-1 bg-white text-[#3A20BA] py-2.5 px-2 rounded-xl text-xs font-bold border border-[#3A20BA]/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5 shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Sample
          </Link>
          <button
            onClick={handleBuy}
            disabled={buying || checkingPurchase}
            className="flex-[1.5] w-full bg-[#3A20BA] text-white py-2.5 px-2 rounded-xl text-xs font-bold shadow-md shadow-[#3A20BA]/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5 disabled:opacity-70"
          >
            {buying ? "Processing..." : `Buy Now • ₹${book.buyprice}`}
          </button>
        </>
      )}
    </div>
  );
}
