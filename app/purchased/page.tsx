"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { signInWithPopup, googleProvider, auth, db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { ProceduralCover } from "@/components/ProceduralCover";
import { Download, BookOpen, Clock, MoreVertical, FileText, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { savePdfOffline, isPdfOffline, removePdfOffline } from "@/lib/offline-storage";

export default function PurchasedPage() {
  const { user, loading: authLoading } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offlineStatus, setOfflineStatus] = useState<Record<string, boolean>>({});
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  const checkOfflineStatus = async (purchasedItems: any[]) => {
    const status: Record<string, boolean> = {};
    for (const item of purchasedItems) {
      const bookKey = item.bookId || item.seoslug;
      if (bookKey) {
        status[bookKey] = await isPdfOffline(bookKey);
      }
    }
    setOfflineStatus(status);
  };

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "purchases"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // sorting by purchasedAt manually since we didn't create a composite index
        data.sort((a: any, b: any) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
        setPurchases(data);
        await checkOfflineStatus(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'purchases');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchPurchases();
  }, [user]);

  const handleDownloadOffline = async (purchase: any) => {
    const bookKey = purchase.bookId || purchase.seoslug;
    if (!bookKey) return;

    if (offlineStatus[bookKey]) {
      // Remove offline download
      if (confirm("Remove offline download?")) {
        try {
          await removePdfOffline(bookKey);
          setOfflineStatus(prev => ({ ...prev, [bookKey]: false }));
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    try {
      setDownloading(prev => ({ ...prev, [bookKey]: true }));
      let pdfurl = purchase.pdfurl;
      if (!pdfurl) {
        const docRef = doc(db, "books", bookKey);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          pdfurl = docSnap.data().pdfurl;
        } else {
          const q = query(collection(db, "books"), where("seoslug", "==", bookKey));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            pdfurl = qSnap.docs[0].data().pdfurl;
          }
        }
      }

      if (pdfurl) {
        const proxyUrl = "/api/pdf?url=" + encodeURIComponent(pdfurl);
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Failed to fetch PDF");
        const arrayBuffer = await response.arrayBuffer();
        await savePdfOffline(bookKey, arrayBuffer);
        setOfflineStatus(prev => ({ ...prev, [bookKey]: true }));
      } else {
        alert("PDF download URL is not available for this book in database.");
      }
    } catch (err) {
      console.error("Error downloading offline PDF:", err);
      alert("Failed to download book for offline viewing.");
    } finally {
      setDownloading(prev => ({ ...prev, [bookKey]: false }));
    }
  };

  if (authLoading) return null;

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
        alert("Domain not authorized for OAuth. Please add this app's URL to Firebase Console > Authentication > Settings > Authorized domains.");
      } else {
        alert("Failed to sign in: " + error.message);
      }
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen pt-20 pb-8 max-w-md md:max-w-2xl mx-auto px-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-[#2053BA]/10 text-[#2053BA] rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view your library</h2>
        <p className="text-xs text-gray-500 mb-8">Access your purchased books and offline downloads across all your devices.</p>
        <button 
          onClick={handleSignIn}
          className="w-full py-3.5 bg-[#2053BA] text-white rounded-xl text-sm font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5 bg-white rounded-full p-1 text-[#2053BA]" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-3 pb-24 max-w-md md:max-w-2xl mx-auto px-2.5 bg-white">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100">
        <div>
          <h1 className="text-lg font-black text-gray-900 tracking-tight">My Purchased Books</h1>
          <p className="text-[0.6111rem] text-gray-500 font-medium">Your personal digital library and downloads</p>
        </div>
        {purchases.length > 0 && (
          <span className="text-[0.5556rem] font-extrabold text-[#2053BA] bg-[#2053BA]/10 px-2.5 py-1 rounded-full">
            {purchases.length} {purchases.length === 1 ? "Book" : "Books"}
          </span>
        )}
      </div>
      
      {loading ? (
        <div className="flex flex-col gap-3 py-2">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>)}
        </div>
      ) : purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-xs font-bold text-gray-900">Your library is empty</h3>
          <p className="text-[0.6111rem] text-gray-500 mt-1 mb-5">E-books you purchase will appear here seamlessly for instant reading.</p>
          <Link href="/" className="px-5 py-2 bg-[#2053BA] text-white text-xs font-bold rounded-full active:scale-95 transition-transform shadow-sm">
            Explore E-Books
          </Link>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="py-3 flex gap-3 items-start hover:bg-gray-50/60 transition-colors">
              <ProceduralCover title={purchase.title} className="w-[68px] shrink-0 rounded overflow-hidden shadow-2xs" />
              
              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[0.5rem] font-extrabold text-[#8720BA] uppercase tracking-wider truncate">
                      {purchase.category || "E-Book"}
                    </span>
                    <span className="text-[0.5rem] text-gray-400 font-medium flex items-center gap-1 shrink-0">
                      <Clock className="w-2.5 h-2.5" /> {new Date(purchase.purchasedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xs font-extrabold text-gray-900 leading-snug line-clamp-2 mb-1">
                    {purchase.title}
                  </h3>
                </div>

                <div>
                  {/* Seamless Reading Progress Indicator */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
                      <div className="bg-[#53BA20] h-1 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                    <span className="text-[0.5rem] font-bold text-gray-500 shrink-0">25% Read</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {offlineStatus[purchase.bookId || purchase.seoslug] ? (
                      <Link 
                        href={`/read/${purchase.bookId || purchase.seoslug}?type=offline`} 
                        className="flex-1 bg-[#53BA20] hover:bg-[#439619] text-white py-1.5 px-3 rounded-lg text-[0.6111rem] font-bold active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <BookOpen className="w-3 h-3" /> Read Offline
                      </Link>
                    ) : (
                      <Link 
                        href={`/read/${purchase.bookId || purchase.seoslug}?type=full${purchase.pdfurl ? `&url=${encodeURIComponent(purchase.pdfurl)}` : ""}`} 
                        className="flex-1 bg-[#2053BA] hover:bg-[#301a9c] text-white py-1.5 px-3 rounded-lg text-[0.6111rem] font-bold active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <BookOpen className="w-3 h-3" /> Read Online
                      </Link>
                    )}
                    <button 
                      onClick={() => handleDownloadOffline(purchase)}
                      disabled={downloading[purchase.bookId || purchase.seoslug]}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 px-3 rounded-lg text-[0.6111rem] font-bold active:scale-95 transition-transform flex items-center justify-center gap-1 border border-gray-200/80 disabled:opacity-50"
                    >
                      {downloading[purchase.bookId || purchase.seoslug] ? (
                        <>
                          <Loader2 className="w-3 h-3 text-[#2053BA] animate-spin" /> Saving...
                        </>
                      ) : offlineStatus[purchase.bookId || purchase.seoslug] ? (
                        <>
                          <Trash2 className="w-3 h-3 text-red-500" /> Remove
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3 text-[#2053BA]" /> Download
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
