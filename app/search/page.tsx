"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronLeft } from "lucide-react";
import { fetchFirestoreBooks, Book } from "@/lib/books-store";
import { DEFAULT_BOOKS } from "@/lib/books-data";
import { BookCard } from "@/components/BookCard";

export default function SearchPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    let active = true;
    const loadBooks = async () => {
      try {
        const fetched = await fetchFirestoreBooks();
        if (active) {
          setBooks(fetched && fetched.length > 0 ? fetched : DEFAULT_BOOKS);
        }
      } catch (error) {
        console.error("Error fetching books for search:", error);
        if (active) {
          setBooks(DEFAULT_BOOKS);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    
    loadBooks();

    return () => {
      active = false;
    };
  }, []);

  const displayBooks = books.length > 0 ? books : DEFAULT_BOOKS;

  const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return displayBooks;

    return displayBooks.filter((book) => {
      const titleMatch = book.title.toLowerCase().includes(query);
      const categoryMatch = book.category?.toLowerCase().includes(query);
      const descMatch = book.seoDescription?.toLowerCase().includes(query);
      const tagMatch = book.tags?.some((t) => t.toLowerCase().includes(query));
      return titleMatch || categoryMatch || descMatch || tagMatch;
    });
  }, [displayBooks, searchQuery]);

  return (
    <main className="min-h-screen bg-white pb-20 max-w-md md:max-w-2xl mx-auto overflow-x-hidden">
      {/* Header / Search */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-2.5 pt-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="p-1.5 -ml-1 rounded-full hover:bg-gray-100 text-gray-700 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2053BA]" />
            <input 
              ref={inputRef}
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books..."
              className="w-full bg-gray-50 border border-[#2053BA]/30 rounded-full py-2 pl-9 pr-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2053BA]/50 transition-all shadow-[0_0_0_3px_rgba(58,32,186,0.08)]"
            />
          </div>
        </div>
      </div>

      <div className="px-2.5 mt-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2053BA] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {searchQuery && (
              <p className="text-xs font-semibold text-gray-500 mb-2 px-1">
                {filteredBooks.length} result{filteredBooks.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
              </p>
            )}
            
            {filteredBooks.length > 0 ? (
              filteredBooks.map((book, idx) => (
                <BookCard key={book.id || idx} book={book} layout="list" />
              ))
            ) : (
              <div className="py-12 text-center text-gray-500">
                <p className="text-sm">No books found matching &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
