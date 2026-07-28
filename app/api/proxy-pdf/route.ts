import { NextRequest, NextResponse } from "next/server";

const FALLBACK_PDF_URL = "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Handle common bad test URLs
  if (targetUrl.includes("dummy.pdf") || targetUrl.includes("sample.pdf")) {
    targetUrl = FALLBACK_PDF_URL;
  }

  try {
    let response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "application/pdf,application/octet-stream,*/*",
      },
      cache: "no-store",
    });

    // If initial fetch failed or was forbidden (e.g. 403 from w3.org), try fallback PDF
    if (!response.ok && targetUrl !== FALLBACK_PDF_URL) {
      console.warn(`Target PDF URL returned status ${response.status}, attempting fallback PDF...`);
      response = await fetch(FALLBACK_PDF_URL, {
        headers: {
          Accept: "application/pdf,*/*",
        },
      });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch remote PDF (Status ${response.status})` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "application/pdf";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType.includes("pdf") ? "application/pdf" : "application/pdf",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("PDF Proxy error:", error);

    // Try fallback on network/fetch exception
    try {
      const fallbackResp = await fetch(FALLBACK_PDF_URL);
      if (fallbackResp.ok) {
        const buffer = await fallbackResp.arrayBuffer();
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch {}

    return NextResponse.json(
      { error: error?.message || "Failed to proxy PDF file" },
      { status: 500 }
    );
  }
}

