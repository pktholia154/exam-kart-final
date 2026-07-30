"use client";

import { useState } from "react";
import { writeBatch, doc, collection, getDocs } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { DEFAULT_BOOKS, DEFAULT_CATEGORIES } from "@/lib/books-server";

export function SeedDataButton() {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClearData = async () => {
    if (!window.confirm("Are you sure you want to delete all books and categories?")) return;
    setClearing(true);
    try {
      const batch = writeBatch(db);
      
      const booksSnap = await getDocs(collection(db, "books"));
      booksSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      const catSnap = await getDocs(collection(db, "categories"));
      catSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      alert("All books and categories have been cleared.");
      window.location.reload();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "categories/books");
    } finally {
      setClearing(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const batch = writeBatch(db);

      DEFAULT_CATEGORIES.forEach((cat) => {
        const docRef = doc(collection(db, "categories"));
        batch.set(docRef, { name: cat.name, seoslug: cat.seoslug });
      });

      DEFAULT_BOOKS.forEach((b) => {
        const docRef = doc(collection(db, "books"));
        batch.set(docRef, {
          title: b.title,
          seoslug: b.seoslug,
          category: b.category,
          publisher: b.publisher || "Exam Kart Press",
          pdfurl: b.pdfurl,
          sampleurl: b.sampleurl,
          listprice: b.listprice,
          buyprice: b.buyprice,
          seoDescription: b.seoDescription,
          fullDescription: b.fullDescription,
          tags: b.tags,
          averageRating: b.averageRating,
          reviewCount: b.reviewCount,
          language: b.language,
          pageCount: b.pageCount,
          fileSizeInMB: b.fileSizeInMB,
        });
      });

      await batch.commit();
      alert("Database 'pdfbooks' successfully seeded with categories and books!");
      window.location.reload();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "categories/books");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="pt-2 pb-4 space-y-2">
      <button
        onClick={handleSeedData}
        disabled={seeding || clearing}
        className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {seeding ? "Seeding Database..." : "Seed Sample Data to Firestore ('pdfbooks')"}
      </button>
      <button
        onClick={handleClearData}
        disabled={seeding || clearing}
        className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {clearing ? "Clearing..." : "Clear All Books & Categories"}
      </button>
      <p className="text-center text-[10px] text-gray-500 mt-2">
        Manage &apos;categories&apos; and &apos;books&apos; collections in Firestore
      </p>
    </div>
  );
}
