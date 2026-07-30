"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { fetchFirestoreBookBySlugOrId } from "@/lib/books-store";

export default function PDFReader() {
  const params = useParams();
  const searchParams = useSearchParams();

  const bookIdParam = params?.bookId;
  const rawBookId = Array.isArray(bookIdParam) ? bookIdParam[0] : bookIdParam;
  const decodedBookId = rawBookId ? decodeURIComponent(rawBookId) : "";

  const readType = searchParams?.get("type") || searchParams?.get("mode") || "full";
  const explicitUrl = searchParams?.get("file") || searchParams?.get("url");

  const [bookTitle, setBookTitle] = useState<string>("PDF Book Viewer");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [isUrlResolved, setIsUrlResolved] = useState(false);

  const [isPdfLoaded, setIsPdfLoaded] = useState<boolean>(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [fitToWidth, setFitToWidth] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [fallbackSrc, setFallbackSrc] = useState<string>("");
  const [noUrlError, setNoUrlError] = useState(false);

  const scrollViewRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const pageWrappersRef = useRef<HTMLDivElement[]>([]);
  const pageCanvasesRef = useRef<HTMLCanvasElement[]>([]);
  const pageRenderStatesRef = useRef<boolean[]>([]);
  const activeRenderTasksRef = useRef<Record<number, any>>({});
  const renderObserverRef = useRef<IntersectionObserver | null>(null);
  const activePageObserverRef = useRef<IntersectionObserver | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const pdfDocRef = useRef<any>(null);

  const scaleRef = useRef<number>(1.0);
  const fitToWidthRef = useRef<boolean>(true);

  // Sync refs
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    fitToWidthRef.current = fitToWidth;
  }, [fitToWidth]);

  // 1. Resolve Target PDF URL from Search Params or Firestore
  useEffect(() => {
    let active = true;

    async function resolveUrl() {
      let firestoreUrl = "";

      if (decodedBookId) {
        try {
          const bookData = await fetchFirestoreBookBySlugOrId(decodedBookId);
          if (active && bookData) {
            if (bookData.title) setBookTitle(bookData.title);

            if (readType === "sample") {
              firestoreUrl = bookData.sampleurl || bookData.pdfurl || "";
            } else {
              firestoreUrl = bookData.pdfurl || bookData.sampleurl || "";
            }
          }
        } catch (e) {
          console.warn("Error fetching book details for reader:", e);
        }
      }

      const targetUrl = firestoreUrl || (explicitUrl ? decodeURIComponent(explicitUrl) : "");

      if (active) {
        if (targetUrl) {
          setFileUrl(targetUrl);
          setIsUrlResolved(true);
        } else {
          setNoUrlError(true);
          setIsLoading(false);
          setIsUrlResolved(true);
        }
      }
    }

    resolveUrl();

    return () => {
      active = false;
    };
  }, [explicitUrl, decodedBookId, readType]);

  // Fallback Frame Handler
  const triggerFallbackFrame = useCallback((urlToUse: string) => {
    if (isLoadedRef.current) return;
    isLoadedRef.current = true;
    setUseFallback(true);
    setIsLoading(false);

    if (urlToUse.startsWith("http://") || urlToUse.startsWith("https://")) {
      setFallbackSrc(`https://docs.google.com/viewer?url=${encodeURIComponent(urlToUse)}&embedded=true`);
    } else {
      setFallbackSrc(urlToUse);
    }
  }, []);

  // Render a single page canvas with exact proportional scaling and high-DPI sharpness
  const renderPage = useCallback(async (num: number, canvas: HTMLCanvasElement, wrapper: HTMLDivElement) => {
    const doc = pdfDocRef.current;
    if (!doc) return;

    // Cancel existing render task for this page if in progress
    if (activeRenderTasksRef.current[num]) {
      try {
        activeRenderTasksRef.current[num].cancel();
      } catch {
        // Ignore cancel errors
      }
      delete activeRenderTasksRef.current[num];
    }

    try {
      const page = await doc.getPage(num);
      const unscaledViewport = page.getViewport({ scale: 1.0 });

      // Determine correct zoom scale based on fitToWidth mode or user zoom
      let renderScale = scaleRef.current;
      const container = scrollViewRef.current;
      const availableWidth = container ? Math.max(container.clientWidth - 24, 280) : window.innerWidth - 24;

      if (fitToWidthRef.current && availableWidth > 0) {
        renderScale = availableWidth / unscaledViewport.width;
      }

      const viewport = page.getViewport({ scale: renderScale });

      // High-DPI (Retina/Mobile) super-sampling for crystal clear ultra-sharp text
      const dpr = Math.max(window.devicePixelRatio || 1, 2.5);

      const pixelWidth = Math.floor(viewport.width * dpr);
      const pixelHeight = Math.floor(viewport.height * dpr);

      const aspectWidth = Math.floor(viewport.width);
      const aspectHeight = Math.floor(viewport.height);

      // Instant CSS update for this specific page
      canvas.style.width = `${aspectWidth}px`;
      canvas.style.maxWidth = "none";
      canvas.style.height = "auto";
      canvas.style.aspectRatio = `${aspectWidth} / ${aspectHeight}`;

      if (wrapper) {
        wrapper.style.maxWidth = `${aspectWidth}px`;
        wrapper.style.aspectRatio = `${aspectWidth} / ${aspectHeight}`;
      }

      const scaleKey = `${renderScale.toFixed(4)}_${dpr}`;
      if (canvas.getAttribute("data-render-key") === scaleKey) {
        return; // Already rendered at this exact crisp resolution
      }

      // Render to an offscreen canvas first to prevent white flashes while zooming
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = pixelWidth;
      tempCanvas.height = pixelHeight;
      const tempCtx = tempCanvas.getContext("2d", { alpha: false });
      if (!tempCtx) return;

      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = "high";

      tempCtx.save();
      tempCtx.scale(dpr, dpr);

      // Fill clean white background before rendering
      tempCtx.fillStyle = "#ffffff";
      tempCtx.fillRect(0, 0, viewport.width, viewport.height);

      const renderContext = {
        canvasContext: tempCtx,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      activeRenderTasksRef.current[num] = renderTask;

      await renderTask.promise;
      delete activeRenderTasksRef.current[num];
      tempCtx.restore();

      // Swap the rendered buffer to the visible canvas for instant clarity
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(tempCanvas, 0, 0);
      }
      canvas.setAttribute("data-render-key", scaleKey);
    } catch (err: any) {
      if (err?.name !== "RenderingCancelledException") {
        console.warn(`Render error on page ${num}:`, err);
        pageRenderStatesRef.current[num] = false;
      }
    }
  }, []);

  // Setup Pages and Intersection Observers
  const setupPages = useCallback(async () => {
    const doc = pdfDocRef.current;
    const canvasContainer = canvasContainerRef.current;
    const scrollView = scrollViewRef.current;
    if (!doc || !canvasContainer || !scrollView) return;

    // Disconnect old observers
    if (renderObserverRef.current) renderObserverRef.current.disconnect();
    if (activePageObserverRef.current) activePageObserverRef.current.disconnect();

    canvasContainer.replaceChildren();
    pageWrappersRef.current = [];
    pageCanvasesRef.current = [];
    pageRenderStatesRef.current = new Array(doc.numPages + 1).fill(false);

    // Get page 1 viewport to calculate initial page aspect ratio for placeholder wrappers
    let sampleAspect = "1 / 1.414"; // Standard A4 default
    let initialAspectWidth = 0;
    try {
      const page1 = await doc.getPage(1);
      let initialScale = scaleRef.current;
      if (fitToWidthRef.current && scrollView) {
        const unscaledViewport = page1.getViewport({ scale: 1.0 });
        const availableWidth = Math.max(scrollView.clientWidth - 24, 280);
        initialScale = availableWidth / unscaledViewport.width;
      }
      const vp1 = page1.getViewport({ scale: initialScale });
      sampleAspect = `${vp1.width} / ${vp1.height}`;
      initialAspectWidth = Math.floor(vp1.width);
    } catch (e) {
      console.warn("Could not inspect page 1 viewport:", e);
    }

    // IntersectionObserver for Rendering on Scroll
    renderObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute("data-page-num") || "1", 10);
            if (!pageRenderStatesRef.current[pageNum]) {
              pageRenderStatesRef.current[pageNum] = true;
              const canvasEl = entry.target.querySelector("canvas");
              if (canvasEl) {
                renderPage(pageNum, canvasEl as HTMLCanvasElement, entry.target as HTMLDivElement);
              }
            }
          }
        });
      },
      { root: scrollView, rootMargin: "600px 0px" }
    );

    // IntersectionObserver for Active Page Tracking
    activePageObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute("data-page-num") || "1", 10);
            setCurrentPage(pageNum);
          }
        });
      },
      { root: scrollView, threshold: 0.25 }
    );

    for (let i = 1; i <= doc.numPages; i++) {
      const wrapper = document.createElement("div");
      wrapper.className = "pdf-page-wrapper";
      wrapper.setAttribute("data-page-num", i.toString());
      wrapper.style.aspectRatio = sampleAspect;
      if (initialAspectWidth > 0) {
        wrapper.style.maxWidth = `${initialAspectWidth}px`;
      }

      const canvas = document.createElement("canvas");
      canvas.className = "pdf-page-canvas";
      canvas.setAttribute("data-page-num", i.toString());
      if (initialAspectWidth > 0) {
        canvas.style.width = `${initialAspectWidth}px`;
        canvas.style.aspectRatio = sampleAspect;
      }

      wrapper.appendChild(canvas);
      canvasContainer.appendChild(wrapper);

      pageWrappersRef.current.push(wrapper);
      pageCanvasesRef.current.push(canvas);

      renderObserverRef.current.observe(wrapper);
      activePageObserverRef.current.observe(wrapper);
    }
  }, [renderPage]);

  // Update zoom CSS and re-trigger renders without destroying the DOM
  const applyZoom = useCallback(async () => {
    const doc = pdfDocRef.current;
    if (!doc) return;

    try {
      const page1 = await doc.getPage(1);

      let renderScale = scaleRef.current;
      const container = scrollViewRef.current;
      const availableWidth = container ? Math.max(container.clientWidth - 24, 280) : window.innerWidth - 24;

      const unscaledViewport = page1.getViewport({ scale: 1.0 });

      if (fitToWidthRef.current && availableWidth > 0) {
        renderScale = availableWidth / unscaledViewport.width;
      }

      const viewport1 = page1.getViewport({ scale: renderScale });
      const aspectWidth = Math.floor(viewport1.width);
      const aspectHeight = Math.floor(viewport1.height);
      const sampleAspect = `${aspectWidth} / ${aspectHeight}`;

      // 1. Immediately update CSS on all wrappers and canvases for instant response
      pageWrappersRef.current.forEach((wrapper) => {
        if (wrapper) {
          wrapper.style.maxWidth = `${aspectWidth}px`;
          wrapper.style.aspectRatio = sampleAspect;
        }
      });

      pageCanvasesRef.current.forEach((canvas) => {
        if (canvas) {
          canvas.style.width = `${aspectWidth}px`;
          canvas.style.aspectRatio = sampleAspect;
        }
      });

      // 2. Reset render states to force vector clarity at new scale
      pageRenderStatesRef.current.fill(false);

      // 3. Immediately re-render currently visible pages
      pageWrappersRef.current.forEach((wrapper, index) => {
        if (wrapper) {
          const rect = wrapper.getBoundingClientRect();
          if (rect.top < window.innerHeight + 800 && rect.bottom > -800) {
            const pageNum = index + 1;
            const canvasEl = pageCanvasesRef.current[index];
            if (canvasEl) {
              pageRenderStatesRef.current[pageNum] = true;
              renderPage(pageNum, canvasEl, wrapper);
            }
          }
        }
      });

      // 4. Re-observe remaining pages
      if (renderObserverRef.current) {
        renderObserverRef.current.disconnect();
        requestAnimationFrame(() => {
          if (renderObserverRef.current) {
            pageWrappersRef.current.forEach((wrapper) => {
              if (wrapper) renderObserverRef.current!.observe(wrapper);
            });
          }
        });
      }
    } catch (e) {
      console.warn("Error applying zoom:", e);
    }
  }, [renderPage]);

  // Re-render all pages on zoom change
  const reRenderAll = useCallback(() => {
    applyZoom();
  }, [applyZoom]);

  // Touch Pinch-to-Zoom Gesture Handler for Mobile Devices (Chrome PDFium feel)
  useEffect(() => {
    const container = scrollViewRef.current;
    if (!container) return;

    let initialDist = 0;
    let startScale = scaleRef.current;
    let isPinching = false;
    let currentFactor = 1;

    const getDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching = true;
        initialDist = getDistance(e.touches);
        startScale = scaleRef.current;
        currentFactor = 1;
        setFitToWidth(false);
        fitToWidthRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPinching && e.touches.length === 2) {
        e.preventDefault();
        const dist = getDistance(e.touches);
        if (initialDist > 0) {
          currentFactor = dist / initialDist;
          const targetScale = Math.min(Math.max(startScale * currentFactor, 0.6), 4.0);

          // Instant 60fps CSS transform feedback during pinch gesture
          if (canvasContainerRef.current) {
            const relativeFactor = targetScale / scaleRef.current;
            canvasContainerRef.current.style.transform = `scale(${relativeFactor})`;
            canvasContainerRef.current.style.transformOrigin = "center top";
            canvasContainerRef.current.style.transition = "none";
          }
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isPinching && e.touches.length < 2) {
        isPinching = false;
        if (canvasContainerRef.current) {
          canvasContainerRef.current.style.transform = "";
          canvasContainerRef.current.style.transformOrigin = "";
          canvasContainerRef.current.style.transition = "";
        }

        const finalScale = Math.min(Math.max(+(startScale * currentFactor).toFixed(2), 0.6), 4.0);
        setScale(finalScale);
        scaleRef.current = finalScale;
        reRenderAll();
      }
    };

    // Desktop trackpad / Ctrl + Wheel Pinch Zoom
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setFitToWidth(false);
        fitToWidthRef.current = false;
        const delta = e.deltaY < 0 ? 0.2 : -0.2;
        setScale((prev) => {
          const next = Math.min(Math.max(+(prev + delta).toFixed(2), 0.6), 4.0);
          scaleRef.current = next;
          setTimeout(reRenderAll, 0);
          return next;
        });
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
      container.removeEventListener("wheel", handleWheel);
    };
  }, [reRenderAll]);

  // Handle window resize to adjust fit-to-width mode
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (fitToWidthRef.current && pdfDocRef.current) {
          reRenderAll();
        }
      }, 250);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, [reRenderAll]);

  // Main PDF loading runner
  useEffect(() => {
    if (!isUrlResolved || !fileUrl || noUrlError) return;

    let active = true;
    let loadTimeout: NodeJS.Timeout;

    // Safety timeout: 4 seconds fallback
    loadTimeout = setTimeout(() => {
      if (active && !isLoadedRef.current && !pdfDocRef.current) {
        console.warn("PDF.js loading timeout reached. Switching to fallback viewer...");
        triggerFallbackFrame(fileUrl);
      }
    }, 4000);

    // Load PDF.js engine with Standard Fonts & CMaps configuration
    async function initPdfEngine() {
      if (!(window as any).pdfjsLib) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load pdf.js script"));
          document.head.appendChild(script);
        });
      }

      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      const pdfDocumentConfig = {
        cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
        cMapPacked: true,
        standardFontDataUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/",
      };

      // First attempt: Fetch ArrayBuffer directly
      try {
        const response = await fetch(fileUrl, { mode: "cors" });
        if (!response.ok) throw new Error("Network response not OK");
        const arrayBuffer = await response.arrayBuffer();

        if (!active) return;
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          ...pdfDocumentConfig,
        });
        const doc = await loadingTask.promise;

        if (!active) return;
        clearTimeout(loadTimeout);
        isLoadedRef.current = true;
        pdfDocRef.current = doc;
        setIsPdfLoaded(true);
        setNumPages(doc.numPages);
        setIsLoading(false);

        setupPages();
      } catch (fetchErr) {
        console.warn("Direct fetch ArrayBuffer failed/CORS. Attempting proxy load...", fetchErr);
        if (!active) return;
        tryProxyLoad(pdfjsLib, pdfDocumentConfig);
      }
    }

    async function tryProxyLoad(pdfjsLib: any, pdfConfig: any) {
      const proxyUrl = "/api/pdf?url=" + encodeURIComponent(fileUrl);

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: proxyUrl,
          withCredentials: false,
          ...pdfConfig,
        });
        const doc = await loadingTask.promise;

        if (!active) return;
        clearTimeout(loadTimeout);
        isLoadedRef.current = true;
        pdfDocRef.current = doc;
        setIsPdfLoaded(true);
        setNumPages(doc.numPages);
        setIsLoading(false);

        setupPages();
      } catch (error) {
        console.warn("PDF.js failed to load document via proxy. Triggering fallback frame...", error);
        if (!active) return;
        clearTimeout(loadTimeout);
        triggerFallbackFrame(fileUrl);
      }
    }

    initPdfEngine().catch((err) => {
      console.warn("PDF initialization error:", err);
      if (active) {
        clearTimeout(loadTimeout);
        triggerFallbackFrame(fileUrl);
      }
    });

    return () => {
      active = false;
      if (loadTimeout) clearTimeout(loadTimeout);
      if (renderObserverRef.current) renderObserverRef.current.disconnect();
      if (activePageObserverRef.current) activePageObserverRef.current.disconnect();
    };
  }, [fileUrl, isUrlResolved, noUrlError, setupPages, triggerFallbackFrame]);

  // Handle page jump from floating bar input
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setCurrentPage(val || 1);
    if (val >= 1 && pdfDocRef.current && val <= pdfDocRef.current.numPages) {
      const targetWrapper = pageWrappersRef.current[val - 1];
      if (targetWrapper) {
        targetWrapper.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Zoom In
  const handleZoomIn = () => {
    setFitToWidth(false);
    fitToWidthRef.current = false;
    setScale((prev) => {
      const next = +(prev + 0.25).toFixed(2);
      scaleRef.current = next;
      setTimeout(reRenderAll, 0);
      return next;
    });
  };

  // Zoom Out
  const handleZoomOut = () => {
    setFitToWidth(false);
    fitToWidthRef.current = false;
    setScale((prev) => {
      if (prev <= 0.5) return prev;
      const next = +(prev - 0.25).toFixed(2);
      scaleRef.current = next;
      setTimeout(reRenderAll, 0);
      return next;
    });
  };

  // Toggle Fit to Width
  const handleToggleFitWidth = () => {
    setFitToWidth((prev) => {
      const next = !prev;
      fitToWidthRef.current = next;
      if (next) {
        setScale(1.0);
        scaleRef.current = 1.0;
      }
      setTimeout(reRenderAll, 0);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Main Full Page Viewer Container */}
      <div id="viewer-container" className="relative w-full h-full flex-1 overflow-hidden bg-slate-950">
        {/* Error state if no URL was provided */}
        {noUrlError && (
          <div className="m-auto text-center text-red-400 p-5">
            <h3 className="text-base font-bold text-red-400">No PDF URL provided</h3>
            <p className="text-xs mt-2 text-slate-400">Please specify a valid ?file=URL parameter.</p>
          </div>
        )}

        {/* PDF Canvas Scroll View Area */}
        {!useFallback && !noUrlError && (
          <div id="pdf-scroll-view" ref={scrollViewRef}>
            {isLoading && (
              <div id="loading-spinner">
                <div className="spinner"></div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1" }}>Opening Document...</p>
                <p style={{ fontSize: "11px", color: "#94a3b8", maxWidth: "260px" }}>
                  Rendering pages with high-precision vector engine.
                </p>
              </div>
            )}
            <div ref={canvasContainerRef} className="w-full flex flex-col items-center origin-top transition-transform duration-75" />
          </div>
        )}

        {/* Floating Bottom Toolbar for PDF.js Reader */}
        {!useFallback && !noUrlError && !isLoading && isPdfLoaded && (
          <div className="floating-bottom-bar" id="bottom-toolbar">
            <div className="page-info">
              <span>Page</span>
              <input
                type="number"
                id="page-num"
                className="page-input"
                value={currentPage || 1}
                min={1}
                max={numPages || 1}
                onChange={handlePageInputChange}
              />
              <span>
                / <span id="page-count">{numPages || "-"}</span>
              </span>
            </div>

            <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

            <button
              className={`reader-btn ${fitToWidth ? "bg-[#2053BA]/80 text-white border-[#2053BA]" : ""}`}
              onClick={handleToggleFitWidth}
              title="Toggle Fit to Width"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button className="reader-btn" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button className="reader-btn" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Fallback Google Docs / Direct Iframe Viewer Container */}
        {useFallback && !noUrlError && (
          <div id="fallback-container">
            <iframe id="fallback-frame" src={fallbackSrc} title="PDF Document Viewer" />
          </div>
        )}
      </div>
    </div>
  );
}

