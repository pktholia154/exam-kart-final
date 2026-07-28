import { collection, getDocs, doc, getDoc, writeBatch, query, where } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { DEFAULT_BOOKS, DEFAULT_CATEGORIES } from "./books-data";

export interface Book {
  id: string;
  title: string;
  seoslug: string;
  category: string;
  publsher: string;
  pdfurl: string;
  sampleurl: string;
  listprice: string;
  buyprice: string;
  seoDescription: string;
  fullDescription: string;
  tags: string[];
  averageRating: number;
  reviewCount: number;
  language: string;
  pageCount: number;
  fileSizeInMB: number;
}

export interface Category {
  id?: string;
  name: string;
  seoslug: string;
}

/**
 * Robustly parse Firestore book document supporting all URL field variations
 */
export function parseBookDoc(docSnap: any): Book {
  const data = docSnap.data() || {};
  let meta = data.metadata || {};
  if (typeof meta === "string") {
    try {
      meta = JSON.parse(meta);
    } catch {
      meta = {};
    }
  }

  const findUrl = (...candidates: any[]): string => {
    for (const cand of candidates) {
      if (typeof cand === "string" && cand.trim().length > 0) {
        return cand.trim();
      }
    }
    return "";
  };

  const sampleurl = findUrl(
    data.sampleurl,
    data.sampleUrl,
    data.sample_url,
    data.sample_pdf_url,
    data.samplePdfUrl,
    meta.sampleurl,
    meta.sampleUrl,
    meta.sample_url,
    meta.sample_pdf_url,
    meta.samplePdfUrl
  );

  const pdfurl = findUrl(
    data.pdfurl,
    data.pdfUrl,
    data.pdf_url,
    data.fileUrl,
    data.file_url,
    data.url,
    meta.pdfurl,
    meta.pdfUrl,
    meta.pdf_url,
    meta.fileUrl,
    meta.file_url,
    meta.url
  );

  const finalSampleUrl = sampleurl || pdfurl;
  const finalPdfUrl = pdfurl || sampleurl;

  return {
    id: docSnap.id,
    title: data.title || data.name || meta.title || "Untitled Book",
    seoslug: data.seoslug || data.slug || meta.seoslug || docSnap.id,
    category: data.category || data.categoryName || meta.category || "General",
    publsher: data.publsher || data.publisher || meta.publisher || "Unknown",
    pdfurl: finalPdfUrl,
    sampleurl: finalSampleUrl,
    listprice: String(data.listprice ?? data.listPrice ?? meta.listprice ?? "199"),
    buyprice: String(data.buyprice ?? data.buyPrice ?? meta.buyprice ?? "99"),
    seoDescription: data.seoDescription || data.description || meta.description || "",
    fullDescription: data.fullDescription || data.description || meta.fullDescription || "",
    tags: Array.isArray(data.tags) ? data.tags : (Array.isArray(meta.tags) ? meta.tags : []),
    averageRating: Number(data.averageRating ?? data.rating ?? 4.5),
    reviewCount: Number(data.reviewCount ?? data.reviews ?? 0),
    language: data.language || "English",
    pageCount: Number(data.pageCount ?? data.pages ?? 0),
    fileSizeInMB: Number(data.fileSizeInMB ?? data.size ?? 0),
  };
}

// Memory cache for sub-second page transitions
let cachedBooksMemory: Book[] | null = null;
let cachedCategoriesMemory: Category[] | null = null;

// Helper to save to localStorage safely
function saveToLocalStorage(key: string, value: any) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota error
    }
  }
}

function getFromLocalStorage(key: string): any {
  if (typeof window !== "undefined") {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }
  return null;
}

let inFlightRefreshPromise: Promise<Book[]> | null = null;
let lastRefreshTime = 0;
const REFRESH_THROTTLE_MS = 30000; // 30 seconds throttle for background refresh

/**
 * Ensure Firestore has data. If DB is empty, seeds default categories and books automatically.
 */
export async function ensureFirestoreSeeding(): Promise<void> {
  try {
    const bookSnap = await getDocs(collection(db, "books"));
    if (!bookSnap.empty) {
      return; // DB already populated
    }

    // Seed categories and books in batch
    const batch = writeBatch(db);

    DEFAULT_CATEGORIES.forEach((cat) => {
      const docRef = doc(collection(db, "categories"));
      const { id, ...catData } = cat;
      batch.set(docRef, catData);
    });

    DEFAULT_BOOKS.forEach((b) => {
      const docRef = doc(collection(db, "books"));
      const { id, ...bookData } = b;
      batch.set(docRef, bookData);
    });

    await batch.commit();
    console.log("Firestore database 'pdfbooks' automatically seeded.");
  } catch (err) {
    console.warn("Seeding check error (non-fatal):", err);
  }
}

/**
 * Fetch all categories directly from Firestore.
 */
export async function fetchFirestoreCategories(): Promise<Category[]> {
  // Try memory first
  if (cachedCategoriesMemory && cachedCategoriesMemory.length > 0) {
    return cachedCategoriesMemory;
  }
  const local = getFromLocalStorage("cached_categories");
  if (local && Array.isArray(local) && local.length > 0) {
    cachedCategoriesMemory = local;
  }

  try {
    let snap = await getDocs(collection(db, "categories"));
    if (snap.empty) {
      await ensureFirestoreSeeding();
      snap = await getDocs(collection(db, "categories"));
    }

    const categories: Category[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Category, 'id'>)
    }));

    cachedCategoriesMemory = categories;
    saveToLocalStorage("cached_categories", categories);
    return categories;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "categories");
    return cachedCategoriesMemory || [];
  }
}

/**
 * Fetch all books directly from Firestore with instant caching.
 */
export async function fetchFirestoreBooks(): Promise<Book[]> {
  // Try memory cache first
  if (cachedBooksMemory && cachedBooksMemory.length > 0) {
    // Return cached immediately, refresh in background if throttle elapsed
    if (Date.now() - lastRefreshTime > REFRESH_THROTTLE_MS) {
      refreshBooksInBackground().catch(() => {});
    }
    return cachedBooksMemory;
  }

  const local = getFromLocalStorage("cached_books");
  if (local && Array.isArray(local) && local.length > 0) {
    cachedBooksMemory = local;
    if (Date.now() - lastRefreshTime > REFRESH_THROTTLE_MS) {
      refreshBooksInBackground().catch(() => {});
    }
    return local;
  }

  return await refreshBooksInBackground();
}

async function refreshBooksInBackground(): Promise<Book[]> {
  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise;
  }

  inFlightRefreshPromise = (async () => {
    try {
      let snap = await getDocs(collection(db, "books"));
      if (snap.empty) {
        await ensureFirestoreSeeding();
        snap = await getDocs(collection(db, "books"));
      }

      const books: Book[] = snap.docs.map((d) => parseBookDoc(d));

      cachedBooksMemory = books;
      saveToLocalStorage("cached_books", books);
      lastRefreshTime = Date.now();
      return books;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "books");
      return cachedBooksMemory || [];
    } finally {
      inFlightRefreshPromise = null;
    }
  })();

  return inFlightRefreshPromise;
}

/**
 * Get single book by slug or id directly from Firestore to ensure actual PDF URLs.
 */
export async function fetchFirestoreBookBySlugOrId(slugOrId: string): Promise<Book | null> {
  const decoded = decodeURIComponent(slugOrId);

  // 1. Fetch fresh document directly from Firestore
  const fresh = await verifyBookInFirestore(decoded);
  if (fresh) {
    // Update cache
    const cachedList: Book[] = cachedBooksMemory || getFromLocalStorage("cached_books") || [];
    const idx = cachedList.findIndex(b => b.id === fresh.id || b.seoslug === fresh.seoslug);
    if (idx !== -1) cachedList[idx] = fresh;
    else cachedList.push(fresh);
    cachedBooksMemory = cachedList;
    saveToLocalStorage("cached_books", cachedList);
    return fresh;
  }

  // 2. Fallback to cache if offline
  const cachedList: Book[] = cachedBooksMemory || getFromLocalStorage("cached_books") || [];
  return cachedList.find((b) => b.seoslug === decoded || b.id === decoded) || null;
}

async function verifyBookInFirestore(slugOrId: string, knownId?: string): Promise<Book | null> {
  try {
    // Try document ID lookup first if knownId
    if (knownId) {
      const d = await getDoc(doc(db, "books", knownId));
      if (d.exists()) {
        return parseBookDoc(d);
      }
    }

    // Direct doc ID lookup
    const directDoc = await getDoc(doc(db, "books", slugOrId));
    if (directDoc.exists()) {
      return parseBookDoc(directDoc);
    }

    // Query by seoslug
    const q = query(collection(db, "books"), where("seoslug", "==", slugOrId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return parseBookDoc(snap.docs[0]);
    }

    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "books");
    return null;
  }
}
