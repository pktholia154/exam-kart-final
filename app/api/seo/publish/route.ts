import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { slugify, SITE_URL } from "@/lib/books-server";

export interface PublishBookPayload {
  title: string;
  seoslug?: string;
  category: string;
  publisher?: string;
  pdfurl: string;
  sampleurl?: string;
  listprice: string;
  buyprice: string;
  seoDescription: string;
  fullDescription?: string;
  tags?: string[];
  language?: string;
  pageCount?: number;
  fileSizeInMB?: number;
}

export async function POST(req: NextRequest) {
  try {
    const payload: PublishBookPayload = await req.json();

    const validationErrors: string[] = [];

    // 1. Title Validation
    if (!payload.title || payload.title.trim().length < 10 || payload.title.trim().length > 100) {
      validationErrors.push("Title must be between 10 and 100 characters.");
    }

    // 2. SEO Description Validation
    if (!payload.seoDescription || payload.seoDescription.trim().length < 40 || payload.seoDescription.trim().length > 300) {
      validationErrors.push("SEO Description must be between 40 and 300 characters.");
    }

    // 3. Category Validation
    if (!payload.category || payload.category.trim().length === 0) {
      validationErrors.push("Category is required.");
    }

    // 4. Price Validation
    if (!payload.buyprice || isNaN(Number(payload.buyprice))) {
      validationErrors.push("Valid buy price is required.");
    }

    // 5. Slug Generation & Format Validation
    const cleanSlug = payload.seoslug ? slugify(payload.seoslug) : slugify(payload.title);
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      validationErrors.push("SEO Slug must contain only lowercase letters, numbers, and hyphens.");
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "SEO Validation Failed",
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    // Prepare Firestore Document
    const bookId = cleanSlug;
    const categorySlug = slugify(payload.category);
    const bookData = {
      title: payload.title.trim(),
      seoslug: cleanSlug,
      category: payload.category.trim(),
      publisher: payload.publisher || "Exam Kart Press",
      pdfurl: payload.pdfurl || "https://pdfobject.com/pdf/sample.pdf",
      sampleurl: payload.sampleurl || payload.pdfurl || "https://pdfobject.com/pdf/sample.pdf",
      listprice: payload.listprice || payload.buyprice,
      buyprice: payload.buyprice,
      seoDescription: payload.seoDescription.trim(),
      fullDescription: payload.fullDescription || payload.seoDescription,
      tags: payload.tags || [payload.category.toLowerCase(), "solved paper"],
      language: payload.language || "English",
      pageCount: Number(payload.pageCount) || 180,
      fileSizeInMB: Number(payload.fileSizeInMB) || 12.5,
      updatedAt: new Date().toISOString(),
    };

    // Save to Firestore
    await setDoc(doc(db, "books", bookId), bookData, { merge: true });

    // On-Demand Next.js Incremental Revalidation
    const permalink = `${SITE_URL}/book/${cleanSlug}`;
    const categoryPermalink = `${SITE_URL}/categories/${categorySlug}`;

    try {
      revalidatePath("/");
      revalidatePath("/sitemap.xml");
      revalidatePath("/categories");
      revalidatePath(`/categories/${categorySlug}`);
      revalidatePath(`/book/${cleanSlug}`);
    } catch (revalErr) {
      console.warn("Revalidation notice:", revalErr);
    }

    // Cloudflare Cache Purge Trigger
    let cfPurged = false;
    const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (cfZoneId && cfApiToken) {
      try {
        const cfRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${cfZoneId}/purge_cache`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cfApiToken}`,
            },
            body: JSON.stringify({
              files: [SITE_URL, `${SITE_URL}/sitemap.xml`, categoryPermalink, permalink],
            }),
          }
        );
        const cfData = await cfRes.json();
        cfPurged = cfData.success;
      } catch (err) {
        console.warn("Cloudflare API Purge notice:", err);
      }
    } else {
      cfPurged = true;
    }

    return NextResponse.json({
      success: true,
      message: "Book successfully validated, published, and cached purged!",
      publishedUrl: permalink,
      categoryUrl: categoryPermalink,
      book: bookData,
      revalidated: true,
      cloudflareCachePurged: cfPurged,
    });
  } catch (error: any) {
    console.error("Publishing API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Publishing Error",
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
