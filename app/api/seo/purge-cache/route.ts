import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const { urls, tags } = await req.json();

    const revalidatedPaths: string[] = [];

    // 1. Next.js Path Revalidation
    if (Array.isArray(urls)) {
      for (const urlStr of urls) {
        try {
          const urlObj = new URL(urlStr, "https://exam-kart.com");
          revalidatePath(urlObj.pathname);
          revalidatedPaths.push(urlObj.pathname);
        } catch {
          revalidatePath(urlStr);
          revalidatedPaths.push(urlStr);
        }
      }
    }

    // 2. Next.js Tag Revalidation
    if (Array.isArray(tags)) {
      for (const tag of tags) {
        revalidateTag(tag);
      }
    }

    // 3. Cloudflare API Purge
    const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;

    let cfSuccess = false;
    if (cfZoneId && cfApiToken && Array.isArray(urls)) {
      try {
        const cfRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${cfZoneId}/purge_cache`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cfApiToken}`,
            },
            body: JSON.stringify({ files: urls }),
          }
        );
        const cfData = await cfRes.json();
        cfSuccess = cfData.success;
      } catch (err) {
        console.warn("Cloudflare API Purge notice:", err);
      }
    } else {
      cfSuccess = true;
    }

    return NextResponse.json({
      success: true,
      message: "Targeted cache purge completed successfully.",
      revalidatedPaths,
      cloudflareSuccess: cfSuccess,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Cache Purge Error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
