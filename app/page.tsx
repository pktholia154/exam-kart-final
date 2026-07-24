"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronRight, BookOpen, Star, Download, Shield, ShieldCheck, FileText, RefreshCw, Mail, MapPin, Globe } from "lucide-react";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { BookCard } from "@/components/BookCard";

// Fallback data if DB is empty
const defaultCategories = [
  "Banking Exams", "UPSC", "SSC", "State PSC", 
  "Railways", "Defense", "Insurance", "Teaching",
  "Engineering", "Medical", "Law", "Management"
];

const defaultBooks = [
  { id: "1", title: "IBPS Clerk Paper", seoslug: "ibps-clerk-paper", category: "Banking Exams", buyprice: "99", averageRating: 4.5, reviewCount: 128 },
  { id: "2", title: "SBI PO Mains 2024", seoslug: "sbi-po-mains-2024", category: "Banking Exams", buyprice: "149", averageRating: 4.8, reviewCount: 340 },
  { id: "3", title: "UPSC Prelims CSAT", seoslug: "upsc-prelims-csat", category: "UPSC", buyprice: "199", averageRating: 4.6, reviewCount: 512 },
  { id: "4", title: "SSC CGL Tier 1", seoslug: "ssc-cgl-tier-1", category: "SSC", buyprice: "89", averageRating: 4.3, reviewCount: 204 },
  { id: "5", title: "RRB NTPC Guide", seoslug: "rrb-ntpc-guide", category: "Railways", buyprice: "129", averageRating: 4.2, reviewCount: 156 },
  { id: "6", title: "NDA Mathematics", seoslug: "nda-mathematics", category: "Defense", buyprice: "179", averageRating: 4.7, reviewCount: 289 },
  { id: "7", title: "LIC AAO Mock", seoslug: "lic-aao-mock", category: "Insurance", buyprice: "79", averageRating: 4.4, reviewCount: 92 },
  { id: "8", title: "CTET Paper 1 & 2", seoslug: "ctet-paper-1-2", category: "Teaching", buyprice: "159", averageRating: 4.5, reviewCount: 410 }
];

export default function Home() {
  const [categories, setCategories] = useState<{name: string, seoslug: string}[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const catSnap = await getDocs(collection(db, "categories"));
      const bookSnap = await getDocs(collection(db, "books"));
      
      if (!catSnap.empty) {
        setCategories(catSnap.docs.map(d => d.data() as any));
      }
      if (!bookSnap.empty) {
        setBooks(bookSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'categories/books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleSeedData = async () => {
    try {
      const batch = writeBatch(db);
      
      // Seed Categories
      defaultCategories.forEach(cat => {
        const docRef = doc(collection(db, "categories"));
        batch.set(docRef, { name: cat, seoslug: cat.toLowerCase().replace(/\s+/g, '-') });
      });

      // Seed Books
      defaultBooks.forEach(b => {
        const docRef = doc(collection(db, "books"));
        batch.set(docRef, {
          title: b.title,
          seoslug: b.seoslug,
          category: b.category,
          publsher: "mocktime",
          pdfurl: "url",
          sampleurl: "url",
          listprice: "199",
          buyprice: b.buyprice,
          seoDescription: "Master exam preparation.",
          fullDescription: "Comprehensive guide and mock tests.",
          tags: [b.category.toLowerCase(), "mock test"],
          averageRating: b.averageRating,
          reviewCount: b.reviewCount,
          language: "English",
          pageCount: 150,
          fileSizeInMB: 12.4
        });
      });

      await batch.commit();
      alert("Sample data seeded successfully!");
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'categories/books');
    }
  };

  const displayCategories = categories.length > 0 ? categories.map(c => c.name) : defaultCategories;
  const displayBooks = books.length > 0 ? books : defaultBooks;

  return (
    <main className="min-h-screen pb-8 max-w-md mx-auto overflow-x-hidden">
      {/* Header / Search */}
      <div className="sticky top-0 z-40 bg-[#F5F5F7]/90 backdrop-blur-md px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search books, exams, authors..."
            className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[#3A20BA] focus:ring-1 focus:ring-[#3A20BA] transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="px-4 space-y-8 mt-2">
        {/* Banner */}
        <div className="bg-gradient-to-br from-[#3A20BA] to-[#2053BA] rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 w-2/3">
            <span className="inline-block px-2 py-1 bg-white/20 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2">Deal of the Day</span>
            <h2 className="text-xl font-bold mb-1 leading-tight">UPSC Prelims Masterclass</h2>
            <p className="text-xs text-white/80 mb-4 line-clamp-2">Complete CSAT guide with 10 years solved papers.</p>
            <button className="bg-white text-[#3A20BA] px-4 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-transform">Get Now at ₹199</button>
          </div>
          {/* Decorative shapes */}
          <div className="absolute right-[-20%] top-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute right-[10%] bottom-[-20%] w-24 h-24 bg-black/10 rounded-full blur-xl"></div>
        </div>

        {/* Active Reading Rail */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Continue Reading</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar -mx-4 px-4">
            {displayBooks.slice(0, 3).map((book, idx) => (
              <div key={idx} className="snap-start shrink-0 w-64 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-12 aspect-[2/3] bg-[#3A20BA] rounded-tr-xl rounded-l-sm rounded-br-sm shrink-0 flex items-center justify-center relative overflow-hidden">
                   <span className="text-white text-xs font-bold">{book.title.slice(0,2).toUpperCase()}</span>
                   <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-l from-black/10" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-gray-900 truncate mb-1">{book.title}</h3>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5">
                    <div className="bg-[#53BA20] h-1.5 rounded-full" style={{ width: `${(idx * 23) % 40 + 40}%` }}></div>
                  </div>
                  <p className="text-[9px] font-semibold text-gray-500">Page 42 of 150</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories (Chips) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Categories</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {displayCategories.slice(0, 11).map((cat, idx) => (
              <button key={idx} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 active:bg-gray-50 transition-colors">
                {cat}
              </button>
            ))}
            <button className="px-3 py-1.5 bg-[#3A20BA]/5 border border-[#3A20BA]/20 rounded-full text-xs font-bold text-[#3A20BA] flex items-center gap-1 active:bg-[#3A20BA]/10 transition-colors">
              Explore More <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </section>

        {/* Book Grid (4x2) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Trending Books</h2>
            <button className="text-xs font-bold text-[#2053BA]">See All</button>
          </div>
          <div className="grid grid-cols-4 gap-x-2 gap-y-4">
            {displayBooks.slice(0, 8).map((book, idx) => (
              <BookCard key={book.id || idx} book={book} layout="grid" />
            ))}
          </div>
        </section>

        {/* Important Features */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 mb-4 text-center">Why Choose Us?</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#53BA20]/10 flex items-center justify-center text-[#53BA20]">
                <Download className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold leading-tight">Offline<br/>Downloads</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#3A20BA]/10 flex items-center justify-center text-[#3A20BA]">
                <BookOpen className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold leading-tight">Native<br/>Reader</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#BA8720]/10 flex items-center justify-center text-[#BA8720]">
                <Shield className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold leading-tight">Secure<br/>Purchases</p>
            </div>
          </div>
        </section>

        {/* Book List (10 Items) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">New Arrivals</h2>
          </div>
          <div className="flex flex-col gap-3">
            {(displayBooks.length > 8 ? displayBooks.slice(0, 10) : [...displayBooks, ...defaultBooks.slice(0, 2)]).map((book, idx) => (
              <BookCard key={idx} book={book} layout="list" />
            ))}
          </div>
        </section>

        {/* Footer & Policy Navigation Section */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 tracking-tight mb-1">Quick Links & Policies</h2>
            <p className="text-[11px] text-gray-500">Legal, support, and contact details for Exam Kart</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link 
              href="/privacy-policy" 
              className="p-3 bg-[#F5F5F7] rounded-2xl flex flex-col justify-between hover:bg-[#3A20BA]/5 border border-transparent hover:border-[#3A20BA]/20 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#3A20BA]/10 text-[#3A20BA] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 group-hover:text-[#3A20BA]">Privacy Policy</h3>
                <p className="text-[10px] text-gray-500">Data usage & protection</p>
              </div>
            </Link>

            <Link 
              href="/terms-and-conditions" 
              className="p-3 bg-[#F5F5F7] rounded-2xl flex flex-col justify-between hover:bg-[#2053BA]/5 border border-transparent hover:border-[#2053BA]/20 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#2053BA]/10 text-[#2053BA] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 group-hover:text-[#2053BA]">Terms & Conditions</h3>
                <p className="text-[10px] text-gray-500">User license & agreement</p>
              </div>
            </Link>

            <Link 
              href="/refund-and-cancellation" 
              className="p-3 bg-[#F5F5F7] rounded-2xl flex flex-col justify-between hover:bg-[#53BA20]/5 border border-transparent hover:border-[#53BA20]/20 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#53BA20]/10 text-[#53BA20] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 group-hover:text-[#53BA20]">Refund & Returns</h3>
                <p className="text-[10px] text-gray-500">Cancellation policies</p>
              </div>
            </Link>

            <Link 
              href="/contact-us" 
              className="p-3 bg-[#F5F5F7] rounded-2xl flex flex-col justify-between hover:bg-[#8720BA]/5 border border-transparent hover:border-[#8720BA]/20 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#8720BA]/10 text-[#8720BA] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 group-hover:text-[#8720BA]">Contact Us</h3>
                <p className="text-[10px] text-gray-500">Support & inquiries</p>
              </div>
            </Link>
          </div>

          {/* Contact Summary Box */}
          <div className="bg-[#3A20BA]/5 rounded-2xl p-3.5 border border-[#3A20BA]/10 space-y-2 text-[11px]">
            <div className="flex items-center gap-2 text-gray-800">
              <Mail className="w-3.5 h-3.5 text-[#3A20BA] shrink-0" />
              <span className="truncate"><strong>Email:</strong> <a href="mailto:pardeep1984@gmail.com" className="text-[#3A20BA] font-bold underline">pardeep1984@gmail.com</a></span>
            </div>
            <div className="flex items-start gap-2 text-gray-800">
              <MapPin className="w-3.5 h-3.5 text-[#3A20BA] shrink-0 mt-0.5" />
              <span><strong>Address:</strong> 282, Sector 4, Hisar Haryana 125001</span>
            </div>
            <div className="flex items-center gap-2 text-gray-800">
              <Globe className="w-3.5 h-3.5 text-[#3A20BA] shrink-0" />
              <span className="truncate"><strong>Web:</strong> <a href="https://exam-kart.com/" target="_blank" rel="noreferrer" className="text-[#3A20BA] font-bold underline">https://exam-kart.com/</a></span>
            </div>
          </div>

          <div className="pt-1 text-center">
            <p className="text-[10px] text-gray-400 font-medium">© 2026 Exam Kart. All rights reserved.</p>
          </div>
        </section>

        {/* Admin Seed Button */}
        <section className="pt-2 pb-4">
          <button 
            onClick={handleSeedData}
            className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-bold active:scale-[0.98] transition-transform"
          >
            Seed Sample Data to Firestore
          </button>
          <p className="text-center text-[10px] text-gray-500 mt-2">Initializes &apos;categories&apos; and &apos;books&apos; in &apos;pdfbooks&apos; database</p>
        </section>

      </div>
    </main>
  );
}
