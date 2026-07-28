import { MetadataRoute } from "next";
import { getBooksServer, getCategoriesServer, SITE_URL, slugify } from "@/lib/books-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await getBooksServer();
  const categories = await getCategoriesServer();
  const lastMod = new Date();

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: lastMod,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: lastMod,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms-and-conditions`,
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/refund-and-cancellation`,
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/contact-us`,
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Category clean URLs
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_URL}/categories/${cat.seoslug || slugify(cat.name)}`,
    lastModified: lastMod,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // Book clean landing page URLs
  const bookRoutes: MetadataRoute.Sitemap = books.map((book) => ({
    url: `${SITE_URL}/book/${book.seoslug}`,
    lastModified: lastMod,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryRoutes, ...bookRoutes];
}
