import { cache } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Book, Category, parseBookDoc } from "./books-store";
import { DEFAULT_BOOKS, DEFAULT_CATEGORIES } from "./books-data";

export { DEFAULT_BOOKS, DEFAULT_CATEGORIES };

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://exam-kart.com";

// Rich descriptive copy for each category page for SEO optimization
export const CATEGORY_SEO_DATA: Record<string, { title: string; description: string; longContent: string }> = {
  "banking-exams": {
    title: "Banking Exam Books, Solved Papers & IBPS/SBI Prep Guides",
    description: "Download banking exam prep books, IBPS Clerk/PO solved papers, and SBI PO Mains mock tests with step-by-step solutions.",
    longContent: "Prepare for IBPS PO, IBPS Clerk, SBI PO, SBI Clerk, and RBI Grade B examinations with expert-curated PDF study materials. Our banking section includes topic-wise quantitative aptitude shortcuts, high-level data interpretation sets, logical reasoning puzzles, and financial awareness summaries updated for current exam patterns."
  },
  "upsc": {
    title: "UPSC Civil Services Books & CSAT Prelims Study Material",
    description: "Complete UPSC Civil Services study guides, IAS Prelims CSAT solved question banks, and GS Paper summaries.",
    longContent: "Ace the Civil Services Examination with specialized preparation material for UPSC CSE Prelims and Mains. Access previous 10 years solved CSAT papers, reading comprehension strategies, static general studies modules, and current affairs compilations designed by veteran educators."
  },
  "ssc": {
    title: "SSC CGL, CHSL & Selection Post Preparation E-Books",
    description: "Top rated preparation books for SSC CGL Tier 1 and Tier 2 exams, math formula guides, and general knowledge sets.",
    longContent: "Comprehensive study packages tailored for Staff Selection Commission exams including SSC CGL, CHSL, CPO, and MTS. Master fast calculation math tricks, English grammar rules, static GK tables, and practice full-length mock tests aligned with the latest syllabus."
  },
  "state-psc": {
    title: "State PSC Exam Preparation Books & Solved Papers",
    description: "Download State Public Service Commission study modules, state GK books, and prelims practice papers.",
    longContent: "State-specific general knowledge notes and previous year question banks for State PSC examinations (UPPSC, BPSC, MPPSC, RAS, MPSC, and KPSC). Includes regional history, geography, state current affairs, and mock test papers with answer keys."
  },
  "railways": {
    title: "RRB NTPC, Group D & Railway Recruitment Exam Guides",
    description: "Download Railway Recruitment Board exam preparation books, CBT 1 & 2 guides, and general science practice sets.",
    longContent: "Targeted preparation material for Railway Recruitment Board (RRB) exams including RRB NTPC, Group D, ALP, and Technician. Contains 2500+ general science MCQs, reasoning speed tests, and previous year solved papers."
  },
  "defense": {
    title: "NDA, CDS & AFCAT Defense Exam Preparation Books",
    description: "Official formula sheets, practice modules, and past paper solutions for NDA, CDS, and AFCAT entrance exams.",
    longContent: "Prepare for National Defence Academy (NDA), Combined Defence Services (CDS), and AFCAT exams. Features quick calculus and trigonometry formula sheets, general knowledge digests, and 8+ years of UPSC NDA past paper solutions."
  },
  "insurance": {
    title: "LIC AAO, NIACL & Insurance Exam Study Guides",
    description: "Financial & insurance market awareness notes and full-length mock test papers for LIC AAO and NIACL AO exams.",
    longContent: "Master financial sector awareness, insurance principles, IRDAI regulations, and quantitative aptitude for LIC AAO, LIC ADO, and NIACL Assistant recruitment exams. Includes 10 full-length practice sets with detailed answer explanations."
  },
  "teaching": {
    title: "CTET Paper 1 & 2 Pedagogy & Teaching Entrance Books",
    description: "Child Development and Pedagogy master books and practice tests for CTET Paper 1 & Paper 2.",
    longContent: "Thorough study guides for Central Teacher Eligibility Test (CTET) and State TET exams. Features complete Child Development & Pedagogy notes, Language 1 & 2 practice tests, and Environmental Studies question banks."
  }
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Server-side function to fetch all books directly from Firestore.
 * Wrapped with React cache() to deduplicate requests across single request lifetime.
 */
export const getBooksServer = cache(async (): Promise<Book[]> => {
  try {
    const snap = await getDocs(collection(db, "books"));
    if (!snap.empty) {
      const books = snap.docs.map(d => parseBookDoc(d));
      if (books.length > 0) return books;
    }
  } catch (err) {
    console.warn("getBooksServer notice (using fallback):", err);
  }
  return DEFAULT_BOOKS;
});

/**
 * Server-side function to fetch all categories from Firestore.
 * Wrapped with React cache().
 */
export const getCategoriesServer = cache(async (): Promise<Category[]> => {
  try {
    const snap = await getDocs(collection(db, "categories"));
    if (!snap.empty) {
      const categories: Category[] = snap.docs.map(d => {
        const data = d.data();
        const name = data.name || "Category";
        const seoslug = data.seoslug || slugify(name);
        return { id: d.id, name, seoslug };
      });
      if (categories.length > 0) return categories;
    }
  } catch (err) {
    console.warn("getCategoriesServer notice (using fallback):", err);
  }
  return DEFAULT_CATEGORIES;
});

/**
 * Server-side function to fetch a single book by slug or document ID.
 * Wrapped with React cache().
 */
export const getBookBySlugServer = cache(async (slugOrId: string): Promise<Book | null> => {
  const decoded = decodeURIComponent(slugOrId).toLowerCase();

  try {
    // 1. Try direct doc ID
    const directDoc = await getDoc(doc(db, "books", decoded));
    if (directDoc.exists()) {
      return parseBookDoc(directDoc);
    }

    // 2. Try query by seoslug
    const q = query(collection(db, "books"), where("seoslug", "==", decoded));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return parseBookDoc(snap.docs[0]);
    }
  } catch (err) {
    console.warn("getBookBySlugServer notice (using fallback check):", err);
  }

  // Fallback match from DEFAULT_BOOKS
  const found = DEFAULT_BOOKS.find(
    (b) => b.seoslug.toLowerCase() === decoded || b.id === decoded
  );
  return found || null;
});

/**
 * Server-side function to fetch related books in the same category.
 * Wrapped with React cache().
 */
export const getRelatedBooksServer = cache(async (categoryName: string, currentSlug: string, limitCount = 4): Promise<Book[]> => {
  const all = await getBooksServer();
  const currentClean = currentSlug.toLowerCase();
  const catClean = categoryName.toLowerCase();

  const related = all.filter(
    b => b.seoslug.toLowerCase() !== currentClean && b.category.toLowerCase() === catClean
  );

  if (related.length >= limitCount) {
    return related.slice(0, limitCount);
  }

  // Add items from other categories if not enough
  const extra = all.filter(
    b => b.seoslug.toLowerCase() !== currentClean && b.category.toLowerCase() !== catClean
  );
  return [...related, ...extra].slice(0, limitCount);
});

/**
 * Find category by slug or name.
 * Wrapped with React cache().
 */
export const getCategoryBySlugServer = cache(async (slugOrName: string): Promise<{ category: Category; books: Book[]; seo: { title: string; description: string; longContent: string } } | null> => {
  const decoded = decodeURIComponent(slugOrName).toLowerCase();
  const categories = await getCategoriesServer();

  let matchedCat = categories.find(
    c => c.seoslug.toLowerCase() === decoded || slugify(c.name) === decoded || c.name.toLowerCase() === decoded
  );

  if (!matchedCat) {
    // If exact category isn't in DB list, construct virtual category if it's one of default
    const def = DEFAULT_CATEGORIES.find(
      c => c.seoslug.toLowerCase() === decoded || slugify(c.name) === decoded || c.name.toLowerCase() === decoded
    );
    if (def) matchedCat = def;
  }

  if (!matchedCat) return null;

  const allBooks = await getBooksServer();
  const catNameClean = matchedCat.name.toLowerCase();
  const books = allBooks.filter(b => b.category.toLowerCase() === catNameClean);

  const defaultSeo = CATEGORY_SEO_DATA[matchedCat.seoslug] || {
    title: `${matchedCat.name} E-Books & Study Material`,
    description: `Download premium study material, solved papers, and practice sets for ${matchedCat.name}.`,
    longContent: `Explore our comprehensive collection of ${matchedCat.name} books and study resources. Specially designed for aspirants seeking top scores with high quality practice material.`
  };

  return {
    category: matchedCat,
    books,
    seo: defaultSeo
  };
});
