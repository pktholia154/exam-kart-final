"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { ProceduralCover } from "@/components/ProceduralCover";
import { ArrowLeft, Star, FileText, Globe, Tag, HardDrive, BookOpen, Download, Check } from "lucide-react";
import Link from "next/link";

const defaultBooks = [
  { id: "1", title: "IBPS Clerk Paper", seoslug: "ibps-clerk-paper", category: "Banking Exams", buyprice: "99", listprice: "199", averageRating: 4.5, reviewCount: 128, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." },
  { id: "2", title: "SBI PO Mains 2024", seoslug: "sbi-po-mains-2024", category: "Banking Exams", buyprice: "149", listprice: "249", averageRating: 4.8, reviewCount: 340, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." },
  { id: "3", title: "UPSC Prelims CSAT", seoslug: "upsc-prelims-csat", category: "UPSC", buyprice: "199", listprice: "299", averageRating: 4.6, reviewCount: 512, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." },
  { id: "4", title: "SSC CGL Tier 1", seoslug: "ssc-cgl-tier-1", category: "SSC", buyprice: "89", listprice: "149", averageRating: 4.3, reviewCount: 204, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." },
  { id: "5", title: "RRB NTPC Guide", seoslug: "rrb-ntpc-guide", category: "Railways", buyprice: "129", listprice: "199", averageRating: 4.2, reviewCount: 156, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." },
  { id: "6", title: "NDA Mathematics", seoslug: "nda-mathematics", category: "Defense", buyprice: "179", listprice: "249", averageRating: 4.7, reviewCount: 289, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." },
  { id: "7", title: "LIC AAO Mock", seoslug: "lic-aao-mock", category: "Insurance", buyprice: "79", listprice: "129", averageRating: 4.4, reviewCount: 92, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." },
  { id: "8", title: "CTET Paper 1 & 2", seoslug: "ctet-paper-1-2", category: "Teaching", buyprice: "159", listprice: "249", averageRating: 4.5, reviewCount: 410, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." }
];

export default function BookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      // Safely unwrap params using React.use if needed, but useParams is synchronous in Next 15.
      // However, useParams might return null/undefined during first render in some edge cases.
      const slug = params?.slug;
      if (!slug) return;
      
      try {
        const q = query(collection(db, "books"), where("seoslug", "==", slug));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setBook({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
        } else {
          // Fallback
          const fallbackBook = defaultBooks.find(b => b.seoslug === slug);
          if (fallbackBook) {
            setBook(fallbackBook);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'books');
        const fallbackBook = defaultBooks.find(b => b.seoslug === slug);
        if (fallbackBook) {
          setBook(fallbackBook);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [params?.slug]);

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
        handleFirestoreError(error, OperationType.LIST, 'purchases');
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
  }, [user, book?.id]);

  const handleBuy = async () => {
    if (!user) {
      router.push("/purchased"); // Redirect to sign in (purchased page has sign in)
      return;
    }
    setBuying(true);
    try {
      await addDoc(collection(db, "purchases"), {
        userId: user.uid,
        bookId: book.id,
        title: book.title,
        seoslug: book.seoslug,
        category: book.category,
        purchasedAt: new Date().toISOString(),
      });
      setHasPurchased(true);
      router.push("/purchased");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'purchases');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen max-w-md mx-auto bg-[#F5F5F7] animate-pulse">
        <div className="h-64 bg-gray-200"></div>
        <div className="p-4 space-y-4 -mt-6">
          <div className="bg-white rounded-2xl p-4 h-32"></div>
          <div className="bg-white rounded-2xl p-4 h-48"></div>
        </div>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="min-h-screen max-w-md mx-auto p-4 flex flex-col items-center justify-center text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Book Not Found</h2>
        <button onClick={() => router.back()} className="text-[#3A20BA] font-bold text-sm">Go Back</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-md mx-auto bg-white pb-24 relative overflow-x-hidden">
      {/* Top Nav (Sticky & Transparent) */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-900 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Hero Section (Side-by-side) */}
      <div className="px-5 pt-2 pb-8 flex gap-5 items-start">
        <div className="w-[110px] shrink-0 shadow-lg shadow-[#3A20BA]/10 rounded-lg">
           <ProceduralCover title={book.title} className="w-full rounded-lg" />
        </div>
        
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-[10px] font-bold text-[#8720BA] uppercase tracking-wider mb-1">{book.category}</p>
          <h1 className="text-xl font-black text-gray-900 leading-tight mb-3">{book.title}</h1>
          
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-3">
            <Star className="w-4 h-4 text-[#BA8720] fill-current" />
            <span className="text-sm text-gray-900">{book.averageRating?.toFixed(1)}</span>
            <span className="text-gray-400">({book.reviewCount} reviews)</span>
          </div>
          
          <div className="text-xs font-medium text-gray-500 mb-3">
             By <span className="font-bold text-gray-900">{book.publsher || 'Unknown'}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-gray-900">₹{book.buyprice}</span>
            {Number(book.listprice) > Number(book.buyprice) && (
              <span className="text-[10px] text-gray-400 line-through font-medium">₹{book.listprice}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 pb-8 flex gap-3">
        {hasPurchased ? (
          <>
            <Link href={`/read/${book.id}`} className="flex-1 bg-white text-[#3A20BA] py-3.5 rounded-2xl text-sm font-bold border border-[#3A20BA]/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
               <BookOpen className="w-4 h-4" />
               Read Book
            </Link>
            <Link 
              href={`/read/${book.id}`}
              className="flex-[1.5] bg-[#53BA20] text-white py-3.5 rounded-2xl text-sm font-bold shadow-md shadow-[#53BA20]/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
               <Check className="w-4 h-4" />
               Purchased!
            </Link>
          </>
        ) : (
          <>
            <Link href={`/read/${book.id}`} className="flex-1 bg-white text-[#3A20BA] py-3.5 rounded-2xl text-sm font-bold border border-[#3A20BA]/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
               <FileText className="w-4 h-4" />
               Sample
            </Link>
            <button 
              onClick={handleBuy}
              disabled={buying || checkingPurchase}
              className="flex-[1.5] bg-[#3A20BA] text-white py-3.5 rounded-2xl text-sm font-bold shadow-md shadow-[#3A20BA]/20 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
            >
               {buying ? "Processing..." : "Buy Now"}
            </button>
          </>
        )}
      </div>

      {/* Description */}
      <div className="px-5 pb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">About this book</h2>
        <p className="text-sm text-gray-600 leading-relaxed font-medium mb-4">
          {book.fullDescription || book.seoDescription}
        </p>
        
        {/* Tags */}
        {book.tags && book.tags.length > 0 && (
           <div className="flex flex-wrap gap-2">
             {book.tags.map((tag: string, idx: number) => (
               <span key={idx} className="flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                 <Tag className="w-3 h-3" /> {tag}
               </span>
             ))}
           </div>
        )}
      </div>

      {/* Specifications */}
      <div className="px-5 pb-12">
        <h2 className="text-base font-bold text-gray-900 mb-4">Specifications</h2>
        
        <div className="grid grid-cols-2 gap-y-6">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" /> Language
            </span>
            <span className="text-sm font-bold text-gray-900">{book.language || 'English'}</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" /> Pages
            </span>
            <span className="text-sm font-bold text-gray-900">{book.pageCount || '-'}</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <HardDrive className="w-3.5 h-3.5" /> Size
            </span>
            <span className="text-sm font-bold text-gray-900">{book.fileSizeInMB ? `${book.fileSizeInMB} MB` : '-'}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <Download className="w-3.5 h-3.5" /> Format
            </span>
            <span className="text-sm font-bold text-gray-900">PDF</span>
          </div>
        </div>
      </div>
    </main>
  );
}
