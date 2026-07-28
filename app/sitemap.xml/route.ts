import { NextResponse } from "next/server";
import { getBooksServer, getCategoriesServer, SITE_URL, slugify } from "@/lib/books-server";

export async function GET() {
  const books = await getBooksServer();
  const categories = await getCategoriesServer();
  const now = new Date().toISOString();

  const staticUrls = [
    `${SITE_URL}/`,
    `${SITE_URL}/categories`,
    `${SITE_URL}/privacy-policy`,
    `${SITE_URL}/terms-and-conditions`,
    `${SITE_URL}/refund-and-cancellation`,
    `${SITE_URL}/contact-us`,
  ];

  const categoryUrls = categories.map((c) => `${SITE_URL}/categories/${c.seoslug || slugify(c.name)}`);
  const bookUrls = books.map((b) => `${SITE_URL}/book/${b.seoslug}`);

  const allUrls = [
    ...staticUrls.map((url) => ({ url, priority: "1.0", freq: "daily" })),
    ...categoryUrls.map((url) => ({ url, priority: "0.8", freq: "daily" })),
    ...bookUrls.map((url) => ({ url, priority: "0.9", freq: "weekly" })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (item) => `  <url>
    <loc>${item.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${item.freq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
