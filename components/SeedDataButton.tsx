"use client";

import { useState } from "react";
import { writeBatch, doc, collection } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { DEFAULT_BOOKS, DEFAULT_CATEGORIES } from "@/lib/books-server";

export function SeedDataButton() {
  const [seeding, setSeeding] = useState(false);

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
          publsher: b.publsher || "Exam Kart Press",
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
    <div className="pt-2 pb-4">
      <button
        onClick={handleSeedData}
        disabled={seeding}
        className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {seeding ? "Seeding Database..." : "Seed Sample Data to Firestore ('pdfbooks')"}
      </button>
      <p className="text-center text-[10px] text-gray-500 mt-2">
        Initializes &apos;categories&apos; and &apos;books&apos; collections in Firestore
      </p>
    </div>
  );
}
