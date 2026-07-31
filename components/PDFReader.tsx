"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { fetchFirestoreBookBySlugOrId } from "@/lib/books-store";
import { getPdfOffline } from "@/lib/offline-storage";

import { createEngine, PdfEngine, PdfDocument } from "clawpdf/browser";

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
  const [noUrlError, setNoUrlError] = useState(false);

  const scrollViewRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const pageWrappersRef = useRef<HTMLDivElement[]>([]);
  const pageCanvasesRef = useRef<HTMLCanvasElement[]>([]);
  const pageRenderStatesRef = useRef<boolean[]>([]);
  const renderObserverRef = useRef<IntersectionObserver | null>(null);
  const activePageObserverRef = useRef<IntersectionObserver | null>(null);
  
  const engineRef = useRef<PdfEngine | null>(null);
  const pdfDocRef = useRef<PdfDocument | null>(null);

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
      if (readType === "offline") {
         if (active) {
            setIsUrlResolved(true);
            setFileUrl("offline");
         }
         return;
      }

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

  // Render a single page canvas with exact proportional scaling and high-DPI sharpness
  const renderPage = useCallback(async (num: number, canvas: HTMLCanvasElement, wrapper: HTMLDivElement) => {
    const doc = pdfDocRef.current;
    if (!doc) return;

    try {
      const page = doc.page(num);
      const unscaledWidth = page.width;
      const unscaledHeight = page.height;

      // Determine correct zoom scale based on fitToWidth mode or user zoom
      let renderScale = scaleRef.current;
      const container = scrollViewRef.current;
      const availableWidth = container ? Math.max(container.clientWidth - 24, 280) : window.innerWidth - 24;

      if (fitToWidthRef.current && availableWidth > 0) {
        renderScale = availableWidth / unscaledWidth;
      }

      // High-DPI (Retina/Mobile) super-sampling for crystal clear ultra-sharp text
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      let targetScale = renderScale * dpr;
      if (targetScale > 4.0) targetScale = 4.0;

      // Pre-calculate aspects for instant CSS updates to prevent layout shifts
      const aspectWidth = Math.floor(unscaledWidth * renderScale);
      const aspectHeight = Math.floor(unscaledHeight * renderScale);

      // Instant CSS update for this specific page
      canvas.style.width = `${aspectWidth}px`;
      canvas.style.maxWidth = "none";
      canvas.style.height = `${aspectHeight}px`;
      canvas.style.aspectRatio = `${aspectWidth} / ${aspectHeight}`;

      if (wrapper) {
        wrapper.style.width = `${aspectWidth}px`;
        wrapper.style.maxWidth = `${aspectWidth}px`;
        wrapper.style.height = `${aspectHeight}px`;
        wrapper.style.aspectRatio = `${aspectWidth} / ${aspectHeight}`;
      }

      const scaleKey = `${renderScale.toFixed(4)}_${dpr}`;
      if (canvas.getAttribute("data-render-key") === scaleKey) {
        return; // Already rendered at this exact crisp resolution
      }

      // Use PDFium WASM to render the page block directly to RGBA array
      // To keep UI highly responsive we use setTimeout 0 so render block doesn't completely freeze
      await new Promise(resolve => setTimeout(resolve, 0));
      const { width: pixelWidth, height: pixelHeight, rgba } = page.render({ scale: targetScale, background: "white" });

      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        const imageData = new ImageData(new Uint8ClampedArray(rgba.buffer), pixelWidth, pixelHeight);
        ctx.putImageData(imageData, 0, 0);
      }
      canvas.setAttribute("data-render-key", scaleKey);
    } catch (err: any) {
      console.warn(`Render error on page ${num}:`, err);
      pageRenderStatesRef.current[num] = false;
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
    pageRenderStatesRef.current = new Array(doc.pageCount + 1).fill(false);

    // Get page 1 viewport to calculate initial page aspect ratio for placeholder wrappers
    let sampleAspect = "1 / 1.414"; // Standard A4 default
    let initialAspectWidth = 0;
    let initialAspectHeight = 0;
    try {
      const page1 = doc.page(1);
      let initialScale = scaleRef.current;
      if (fitToWidthRef.current && scrollView) {
        const availableWidth = Math.max(scrollView.clientWidth - 24, 280);
        initialScale = availableWidth / page1.width;
      }
      sampleAspect = `${page1.width} / ${page1.height}`;
      initialAspectWidth = Math.floor(page1.width * initialScale);
      initialAspectHeight = Math.floor(page1.height * initialScale);
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

    for (let i = 1; i <= doc.pageCount; i++) {
      const wrapper = document.createElement("div");
      wrapper.className = "pdf-page-wrapper";
      wrapper.setAttribute("data-page-num", i.toString());
      wrapper.style.aspectRatio = sampleAspect;
      if (initialAspectWidth > 0 && initialAspectHeight > 0) {
        wrapper.style.width = `${initialAspectWidth}px`;
        wrapper.style.maxWidth = `${initialAspectWidth}px`;
        wrapper.style.height = `${initialAspectHeight}px`;
      }

      const canvas = document.createElement("canvas");
      canvas.className = "pdf-page-canvas";
      canvas.setAttribute("data-page-num", i.toString());
      if (initialAspectWidth > 0 && initialAspectHeight > 0) {
        canvas.style.width = `${initialAspectWidth}px`;
        canvas.style.height = `${initialAspectHeight}px`;
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
      const container = scrollViewRef.current;
      const availableWidth = container
        ? Math.max(container.clientWidth - 24, 280)
        : window.innerWidth - 24;

      // 1. Immediately update each page using its own dimensions.
      // This avoids layout jumps when a PDF contains mixed page sizes or rotations.
      pageWrappersRef.current.forEach((wrapper, index) => {
        const canvas = pageCanvasesRef.current[index];
        if (!wrapper || !canvas) return;

        try {
          const page = doc.page(index + 1);
          let renderScale = scaleRef.current;

          if (fitToWidthRef.current && availableWidth > 0) {
            renderScale = availableWidth / page.width;
          }

          const aspectWidth = Math.floor(page.width * renderScale);
          const aspectHeight = Math.floor(page.height * renderScale);
          const pageAspect = `${aspectWidth} / ${aspectHeight}`;

          wrapper.style.width = `${aspectWidth}px`;
          wrapper.style.maxWidth = `${aspectWidth}px`;
          wrapper.style.height = `${aspectHeight}px`;
          wrapper.style.aspectRatio = pageAspect;

          canvas.style.width = `${aspectWidth}px`;
          canvas.style.maxWidth = "none";
          canvas.style.height = `${aspectHeight}px`;
          canvas.style.aspectRatio = pageAspect;
        } catch (pageError) {
          console.warn(`Could not resize page ${index + 1}:`, pageError);
        }
      });

      // 2. Reset render states to force vector clarity at new scale
      pageRenderStatesRef.current.fill(false);

      // 3. Immediately re-render currently visible pages (conservative bounds to prevent memory crash)
      pageWrappersRef.current.forEach((wrapper, index) => {
        if (wrapper) {
          const rect = wrapper.getBoundingClientRect();
          if (rect.top < window.innerHeight + 200 && rect.bottom > -200) {
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

  // Touch Pinch-to-Zoom Gesture Handler for Mobile Devices (stable and finger-anchored)
  useEffect(() => {
    const container = scrollViewRef.current;
    const content = canvasContainerRef.current;
    if (!container || !content) return;

    const MIN_SCALE = 0.6;
    const MAX_SCALE = 4.0;
    const PINCH_SENSITIVITY = 0.72;
    const SMOOTHING = 0.3;
    const DEAD_ZONE = 0.003;

    let isPinching = false;
    let animationFrame = 0;
    let wheelFrame = 0;

    let startDistance = 0;
    let startScale = scaleRef.current;
    let previewScale = startScale;
    let targetScale = startScale;

    let startMidpoint = { x: 0, y: 0 };
    let currentMidpoint = { x: 0, y: 0 };
    let transformOrigin = { x: 0, y: 0 };

    let anchorPage: HTMLDivElement | null = null;
    let anchorRatioX = 0.5;
    let anchorRatioY = 0.5;
    let previousOverflowAnchor = "";

    const clampScale = (value: number) =>
      Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

    const getTouchMetrics = (touches: TouchList) => {
      const first = touches[0];
      const second = touches[1];
      const dx = second.clientX - first.clientX;
      const dy = second.clientY - first.clientY;

      return {
        distance: Math.hypot(dx, dy),
        midpoint: {
          x: (first.clientX + second.clientX) / 2,
          y: (first.clientY + second.clientY) / 2,
        },
      };
    };

    const renderPinchPreview = () => {
      animationFrame = 0;
      if (!isPinching) return;

      const relativeScale = previewScale / startScale;
      const translateX = currentMidpoint.x - startMidpoint.x;
      const translateY = currentMidpoint.y - startMidpoint.y;

      content.style.transformOrigin = `${transformOrigin.x}px ${transformOrigin.y}px`;
      content.style.transform =
        `translate3d(${translateX}px, ${translateY}px, 0) ` +
        `scale(${relativeScale})`;
    };

    const schedulePinchPreview = () => {
      if (animationFrame !== 0) return;
      animationFrame = requestAnimationFrame(renderPinchPreview);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;

      e.preventDefault();

      const metrics = getTouchMetrics(e.touches);
      isPinching = true;
      startDistance = Math.max(metrics.distance, 1);
      startScale = scaleRef.current;
      previewScale = startScale;
      targetScale = startScale;
      startMidpoint = metrics.midpoint;
      currentMidpoint = metrics.midpoint;

      setFitToWidth(false);
      fitToWidthRef.current = false;

      const contentRect = content.getBoundingClientRect();
      transformOrigin = {
        x: startMidpoint.x - contentRect.left,
        y: startMidpoint.y - contentRect.top,
      };

      anchorPage = document
        .elementFromPoint(startMidpoint.x, startMidpoint.y)
        ?.closest(".pdf-page-wrapper") as HTMLDivElement | null;

      if (anchorPage) {
        const pageRect = anchorPage.getBoundingClientRect();
        if (pageRect.width > 0 && pageRect.height > 0) {
          anchorRatioX = Math.min(
            1,
            Math.max(0, (startMidpoint.x - pageRect.left) / pageRect.width)
          );
          anchorRatioY = Math.min(
            1,
            Math.max(0, (startMidpoint.y - pageRect.top) / pageRect.height)
          );
        }
      }

      previousOverflowAnchor = container.style.overflowAnchor;
      container.style.overflowAnchor = "none";
      content.style.transition = "none";
      content.style.willChange = "transform";
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPinching || e.touches.length !== 2) return;

      e.preventDefault();

      const metrics = getTouchMetrics(e.touches);
      currentMidpoint = metrics.midpoint;

      const distanceRatio = metrics.distance / startDistance;
      const adjustedRatio = Math.pow(distanceRatio, PINCH_SENSITIVITY);
      targetScale = clampScale(startScale * adjustedRatio);

      const scaleDifference = targetScale - previewScale;
      if (Math.abs(scaleDifference) >= DEAD_ZONE) {
        previewScale += scaleDifference * SMOOTHING;
      }

      schedulePinchPreview();
    };

    const finishPinch = () => {
      if (!isPinching) return;

      isPinching = false;

      if (animationFrame !== 0) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }

      // Use the smoothed target while preventing tiny accidental scale changes.
      const finalScale = clampScale(
        Math.round(
          (Math.abs(targetScale - startScale) < 0.015 ? startScale : targetScale) * 100
        ) / 100
      );

      scaleRef.current = finalScale;
      setScale(finalScale);

      // applyZoom updates layout synchronously before its page renders complete.
      reRenderAll();

      content.style.transform = "";
      content.style.transformOrigin = "";
      content.style.transition = "";

      // Keep the same point in the PDF underneath the fingers after zoom commits.
      if (anchorPage?.isConnected) {
        const newPageRect = anchorPage.getBoundingClientRect();
        const newAnchorX = newPageRect.left + newPageRect.width * anchorRatioX;
        const newAnchorY = newPageRect.top + newPageRect.height * anchorRatioY;

        container.scrollLeft += newAnchorX - currentMidpoint.x;
        container.scrollTop += newAnchorY - currentMidpoint.y;
      }

      container.style.overflowAnchor = previousOverflowAnchor;

      requestAnimationFrame(() => {
        content.style.willChange = "";
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isPinching && e.touches.length < 2) {
        finishPinch();
      }
    };

    const handleTouchCancel = () => {
      finishPinch();
    };

    // Desktop trackpad / Ctrl + Wheel Pinch Zoom
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();
      setFitToWidth(false);
      fitToWidthRef.current = false;

      // Smaller increments make trackpad zoom less jumpy.
      const delta = e.deltaY < 0 ? 0.05 : -0.05;

      setScale((prev) => {
        const next = clampScale(Math.round((prev + delta) * 100) / 100);
        scaleRef.current = next;

        if (wheelFrame === 0) {
          wheelFrame = requestAnimationFrame(() => {
            wheelFrame = 0;
            reRenderAll();
          });
        }

        return next;
      });
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchCancel);
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      if (animationFrame !== 0) cancelAnimationFrame(animationFrame);
      if (wheelFrame !== 0) cancelAnimationFrame(wheelFrame);

      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchCancel);
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

  // Main PDF loading runner using PDFium WASM
  useEffect(() => {
    if (!isUrlResolved || !fileUrl || noUrlError) return;

    let active = true;

    async function initPdfEngine() {
      try {
        let arrayBuffer: ArrayBuffer;

        if (readType === "offline") {
          const data = await getPdfOffline(decodedBookId);
          if (!data) throw new Error("Offline PDF not found");
          arrayBuffer = data;
        } else {
          // Fetch ArrayBuffer directly
          const response = await fetch(fileUrl, { mode: "cors" });
          if (!response.ok) throw new Error("Network response not OK");
          arrayBuffer = await response.arrayBuffer();
        }

        if (!active) return;
        
        // Ensure old doc/engine is destroyed before creating new
        if (pdfDocRef.current) pdfDocRef.current[Symbol.dispose]();
        if (engineRef.current) engineRef.current.destroy();

        // Use pre-wired browser engine that will load pdfium.esm.wasm
        const engine = await createEngine({ wasmUrl: 'https://unpkg.com/clawpdf@0.3.0/dist/vendor/pdfium.esm.wasm' });
        engineRef.current = engine;
        
        const doc = await engine.open(new Uint8Array(arrayBuffer));
        
        if (!active) {
          doc[Symbol.dispose]();
          engine.destroy();
          return;
        }

        pdfDocRef.current = doc;
        setIsPdfLoaded(true);
        setNumPages(doc.pageCount);
        setIsLoading(false);

        setupPages();
      } catch (fetchErr) {
        if (readType === "offline") {
          console.error("Failed to load offline PDF", fetchErr);
          if (active) {
             setNoUrlError(true);
             setIsLoading(false);
          }
          return;
        }

        console.warn("Direct fetch ArrayBuffer failed/CORS. Attempting proxy load...", fetchErr);
        if (!active) return;
        tryProxyLoad();
      }
    }

    async function tryProxyLoad() {
      const proxyUrl = "/api/pdf?url=" + encodeURIComponent(fileUrl);

      try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Proxy response not OK");
        const arrayBuffer = await response.arrayBuffer();
        
        if (!active) return;

        // Ensure old doc/engine is destroyed before creating new
        if (pdfDocRef.current) pdfDocRef.current[Symbol.dispose]();
        if (engineRef.current) engineRef.current.destroy();

        const engine = await createEngine({ wasmUrl: 'https://unpkg.com/clawpdf@0.3.0/dist/vendor/pdfium.esm.wasm' });
        engineRef.current = engine;
        
        const doc = await engine.open(new Uint8Array(arrayBuffer));
        
        if (!active) {
          doc[Symbol.dispose]();
          engine.destroy();
          return;
        }

        pdfDocRef.current = doc;
        setIsPdfLoaded(true);
        setNumPages(doc.pageCount);
        setIsLoading(false);

        setupPages();
      } catch (error) {
        console.error("PDFium WASM failed to load document.", error);
        if (!active) return;
        setNoUrlError(true);
        setIsLoading(false);
      }
    }

    initPdfEngine();

    return () => {
      active = false;
      if (renderObserverRef.current) renderObserverRef.current.disconnect();
      if (activePageObserverRef.current) activePageObserverRef.current.disconnect();
      
      // Cleanup PDFium engine completely to free WASM memory
      if (pdfDocRef.current) pdfDocRef.current[Symbol.dispose]();
      if (engineRef.current) engineRef.current.destroy();
    };
  }, [fileUrl, isUrlResolved, noUrlError, setupPages]);

  // Handle page jump from floating bar input
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setCurrentPage(val || 1);
    if (val >= 1 && pdfDocRef.current && val <= pdfDocRef.current.pageCount) {
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
    <div className="fixed inset-0 z-[100] w-screen h-screen bg-white text-slate-900 flex flex-col overflow-hidden select-none">
      <div id="viewer-container" className="relative w-full h-full flex-1 overflow-auto bg-white">
        {noUrlError && (
          <div className="m-auto text-center text-red-500 p-5 mt-20">
            <h3 className="text-base font-bold text-red-500">Failed to load PDF</h3>
            <p className="text-xs mt-2 text-slate-500">Please specify a valid URL or check the file.</p>
          </div>
        )}

        {!noUrlError && (
          <div
            id="pdf-scroll-view"
            ref={scrollViewRef}
            className="h-full w-full overflow-auto overscroll-contain"
            style={{
              touchAction: "pan-x pan-y",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {isLoading && (
              <div id="loading-spinner" className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
                <Loader2 className="w-8 h-8 animate-spin text-[#2053BA]" />
                <p className="text-[13px] font-semibold text-slate-800">Initializing PDFium WASM Engine...</p>
                <p className="text-[11px] max-w-[260px] text-center text-slate-500">
                  Loading high-precision WebAssembly vector engine.
                </p>
              </div>
            )}
            <div ref={canvasContainerRef} className="w-max min-w-full mx-auto flex flex-col items-center origin-top" />
          </div>
        )}

        {!noUrlError && !isLoading && isPdfLoaded && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-1.5 rounded-full shadow-sm z-[150]">
            <span className="text-sm font-medium text-slate-700">
              {currentPage} / {numPages || "-"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}