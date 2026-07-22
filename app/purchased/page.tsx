"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { signInWithPopup, googleProvider, auth, db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { ProceduralCover } from "@/components/ProceduralCover";
import { Download, BookOpen, Clock, MoreVertical, FileText } from "lucide-react";
import Link from "next/link";

export default function PurchasedPage() {
  const { user, loading: authLoading } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'purchases');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchPurchases();
  }, [user]);

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
      <main className="min-h-screen pt-20 pb-8 max-w-md mx-auto px-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-[#3A20BA]/10 text-[#3A20BA] rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view your library</h2>
        <p className="text-xs text-gray-500 mb-8">Access your purchased books and offline downloads across all your devices.</p>
        <button 
          onClick={handleSignIn}
          className="w-full py-3.5 bg-[#3A20BA] text-white rounded-xl text-sm font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5 bg-white rounded-full p-1 text-[#3A20BA]" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-4 pb-24 max-w-md mx-auto px-4 bg-[#F5F5F7]">
      <h1 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">My Library</h1>
      
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Your library is empty</h3>
          <p className="text-xs text-gray-500 mt-1 mb-6">Books you purchase will appear here.</p>
          <Link href="/" className="px-6 py-2 bg-[#3A20BA] text-white text-sm font-bold rounded-full active:scale-95 transition-transform">
            Explore Books
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="flex gap-4 items-start">
                <ProceduralCover title={purchase.title} className="w-[70px] shrink-0 rounded-md" />
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-bold text-[#8720BA] uppercase tracking-wider truncate mb-1">{purchase.category}</p>
                    <button className="text-gray-400 p-1 active:bg-gray-100 rounded-full transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight mb-2 line-clamp-2">{purchase.title}</h3>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 font-medium mb-3">
                    <Clock className="w-3 h-3" /> Purchased {new Date(purchase.purchasedAt).toLocaleDateString()}
                  </p>
                  
                  {/* Progress Bar (Mock) */}
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5">
                    <div className="bg-[#53BA20] h-1.5 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  <p className="text-[9px] font-semibold text-gray-500">20% Read</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <Link href={`/read/${purchase.bookId}`} className="flex-1 bg-[#3A20BA] text-white py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" /> Read
                </Link>
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';
                    link.download = `${purchase.title}.pdf`;
                    link.click();
                  }}
                  className="flex-1 bg-[#3A20BA]/5 text-[#3A20BA] py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 border border-[#3A20BA]/10"
                >
                  <Download className="w-3.5 h-3.5" /> Offline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
