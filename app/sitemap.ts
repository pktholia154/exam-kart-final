import type { MetadataRoute } from "next";
import {
  getBooksServer,
  getCategoriesServer,
  slugify,
} from "@/lib/books-server";

const BASE_URL = "https://exam-kart.com";

// Automatically refresh the sitemap at most once every hour.
export const revalidate = 3600;

function getValidDate(value: unknown): Date | undefined {
  if (!value) return undefined;

  const date = value instanceof Date ? value : new Date(String(value));

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getValidSlug(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const slug = value.trim().replace(/^\/+|\/+$/g, "");

  return slug || undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [books, categories] = await Promise.all([
    getBooksServer(),
    getCategoriesServer(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
    },
    {
      url: `${BASE_URL}/categories`,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
    },
    {
      url: `${BASE_URL}/terms-and-conditions`,
    },
    {
      url: `${BASE_URL}/refund-and-cancellation`,
    },
    {
      url: `${BASE_URL}/contact-us`,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.flatMap(
    (category) => {
      const generatedSlug =
        typeof category.name === "string"
          ? slugify(category.name)
          : undefined;

      const slug = getValidSlug(category.seoslug || generatedSlug);

      if (!slug) {
        return [];
      }

      const lastModified = getValidDate(category.updatedAt);

      return [
        {
          url: `${BASE_URL}/categories/${encodeURIComponent(slug)}`,
          ...(lastModified ? { lastModified } : {}),
        },
      ];
    },
  );

  const bookRoutes: MetadataRoute.Sitemap = books.flatMap((book) => {
    const slug = getValidSlug(book.seoslug);

    if (!slug) {
      return [];
    }

    const lastModified =
      getValidDate(book.updatedAt) ?? getValidDate(book.createdAt);

    return [
      {
        url: `${BASE_URL}/book/${encodeURIComponent(slug)}`,
        ...(lastModified ? { lastModified } : {}),
      },
    ];
  });

  const routes = [
    ...staticRoutes,
    ...categoryRoutes,
    ...bookRoutes,
  ];

  // Remove duplicate URLs.
  return Array.from(
    new Map(routes.map((route) => [route.url, route])).values(),
  );
}