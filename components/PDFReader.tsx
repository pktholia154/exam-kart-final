"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  Loader2, 
  Plus, 
  Minus, 
  Sun, 
  Moon, 
  BookOpen,
  Share2
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const defaultBooks = [
  { id: "1", title: "IBPS Clerk Paper", seoslug: "ibps-clerk-paper", category: "Banking Exams", buyprice: "99", listprice: "199", averageRating: 4.5, reviewCount: 128, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." },
  { id: "2", title: "SBI PO Mains 2024", seoslug: "sbi-po-mains-2024", category: "Banking Exams", buyprice: "149", listprice: "249", averageRating: 4.8, reviewCount: 340, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." },
  { id: "3", title: "UPSC Prelims CSAT", seoslug: "upsc-prelims-csat", category: "UPSC", buyprice: "199", listprice: "299", averageRating: 4.6, reviewCount: 512, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." },
  { id: "4", title: "SSC CGL Tier 1", seoslug: "ssc-cgl-tier-1", category: "SSC", buyprice: "89", listprice: "149", averageRating: 4.3, reviewCount: 204, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." },
  { id: "5", title: "RRB NTPC Guide", seoslug: "rrb-ntpc-guide", category: "Railways", buyprice: "129", listprice: "199", averageRating: 4.2, reviewCount: 156, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." },
  { id: "6", title: "NDA Mathematics", seoslug: "nda-mathematics", category: "Defense", buyprice: "179", listprice: "249", averageRating: 4.7, reviewCount: 289, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." },
  { id: "7", title: "LIC AAO Mock", seoslug: "lic-aao-mock", category: "Insurance", buyprice: "79", listprice: "129", averageRating: 4.4, reviewCount: 92, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." },
  { id: "8", title: "CTET Paper 1 & 2", seoslug: "ctet-paper-1-2", category: "Teaching", buyprice: "159", listprice: "249", averageRating: 4.5, reviewCount: 410, publsher: "mocktime", seoDescription: "Master exam preparation.", fullDescription: "Comprehensive guide and mock tests." }
];

export default function PDFReader() {
  const router = useRouter();
  const params = useParams();
  const bookId = params?.bookId as string;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const [bookTitle, setBookTitle] = useState<string>("E-Book Reader");
  const [pdfUrl, setPdfUrl] = useState<string>("https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf");
  
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(360);
  const [showSettings, setShowSettings] = useState(false);

  // Load PDF.js SDK dynamically from CDN to avoid Next.js build-time SSR issues
  useEffect(() => {
    let active = true;

    const loadSdkAndPdf = async () => {
      try {
        // Fetch book title and real PDF URL if bookId is available
        if (bookId) {
          try {
            const docRef = doc(db, "books", bookId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.title) setBookTitle(data.title);
              if (data.pdfurl) setPdfUrl(data.pdfurl); // Fixed key if it's pdfurl instead of pdfUrl based on schema
            } else {
               const fallbackBook = defaultBooks.find(b => b.id === bookId);
               if (fallbackBook) {
                 setBookTitle(fallbackBook.title);
               }
            }
          } catch (e) {
            console.error("Error loading book metadata from Firestore:", e);
            const fallbackBook = defaultBooks.find(b => b.id === bookId);
            if (fallbackBook) {
              setBookTitle(fallbackBook.title);
            }
          }
        }

        if (typeof window === 'undefined') return;

        // Check if already loaded
        if ((window as any).pdfjsLib) {
          if (active) setIsSdkLoaded(true);
          return;
        }

        // Dynamically append script tags for pdf.js and pdf.worker.js
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        
        script.onload = () => {
          const pdfjsLib = (window as any).pdfjsLib;
          if (pdfjsLib) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            if (active) setIsSdkLoaded(true);
          }
        };

        script.onerror = () => {
          if (active) setError("Failed to load the PDF reader engine.");
        };

        document.head.appendChild(script);

      } catch (err) {
        console.error("SDK load error:", err);
        if (active) setError("Could not initialize the reader.");
      }
    };

    loadSdkAndPdf();

    // Responsive container width calculations
    const updateWidth = () => {
      if (typeof window !== 'undefined') {
        const w = window.innerWidth;
        setContainerWidth(w > 448 ? 448 : w);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    // Retrieve saved bookmarks / page positions
    if (bookId) {
      const savedPage = localStorage.getItem(`read_page_${bookId}`);
      const bookmarkState = localStorage.getItem(`bookmark_${bookId}`);
      Promise.resolve().then(() => {
        if (active) {
          if (savedPage) {
            setCurrentPage(parseInt(savedPage, 10));
          }
          if (bookmarkState === 'true') {
            setIsBookmarked(true);
          }
        }
      });
    }

    return () => {
      active = false;
      window.removeEventListener('resize', updateWidth);
    };
  }, [bookId]);

  // Handle PDF parsing once the SDK is loaded
  useEffect(() => {
    if (!isSdkLoaded) return;

    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setLoading(true);
        setError(null);
      }
    });

    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) return;

    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    loadingTask.promise.then((pdf: any) => {
      if (!active) return;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setLoading(false);
    }).catch((err: any) => {
      console.error("Error loading PDF document:", err);
      if (active) {
        setError("Failed to render the document. Please verify the URL or format.");
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [isSdkLoaded, pdfUrl]);

  // Handle page rendering on canvas whenever currentPage, pdfDoc, zoom or containerWidth changes
  useEffect(() => {
    if (!pdfDoc) return;

    let active = true;

    pdfDoc.getPage(currentPage).then((page: any) => {
      if (!active) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      // Fit page to custom container width
      const viewport = page.getViewport({ scale: 1.0 });
      // Calculate scaled factor to fit container minus margin/padding
      const fitScale = (containerWidth - 32) / viewport.width;
      const finalScale = fitScale * zoom;
      const scaledViewport = page.getViewport({ scale: finalScale });

      // Handle High DPI / Retina Displays perfectly sharp
      const dpr = window.devicePixelRatio || 1;
      canvas.width = scaledViewport.width * dpr;
      canvas.height = scaledViewport.height * dpr;
      canvas.style.width = `${scaledViewport.width}px`;
      canvas.style.height = `${scaledViewport.height}px`;
      
      context.scale(dpr, dpr);

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };

      // Cancel previous render task to avoid glitching/overlap
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      renderTask.promise.then(() => {
        renderTaskRef.current = null;
      }).catch((err: any) => {
        // Silently handle cancelled render tasks
      });
    });

    // Save page progression to local storage
    if (bookId) {
      localStorage.setItem(`read_page_${bookId}`, currentPage.toString());
    }

    return () => {
      active = false;
    };
  }, [pdfDoc, currentPage, zoom, containerWidth, bookId]);

  const handleToggleBookmark = () => {
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    if (bookId) {
      localStorage.setItem(`bookmark_${bookId}`, newState.toString());
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: bookTitle,
        text: `Reading ${bookTitle}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert("Link copied to clipboard!");
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Theme styling helpers
  const getThemeClasses = () => {
    switch (theme) {
      case 'sepia':
        return {
          bg: 'bg-[#FAF6EE]',
          text: 'text-[#433422]',
          navBg: 'bg-[#F4ECD8]/95 backdrop-blur-md',
          border: 'border-[#E6DBC4]',
          card: 'bg-[#F4ECD8] shadow-sm border border-[#E6DBC4]/60',
          btnActive: 'bg-[#433422]/10 text-[#433422]',
          accent: 'text-[#8720BA]'
        };
      case 'dark':
        return {
          bg: 'bg-[#121212]',
          text: 'text-[#E0E0E0]',
          navBg: 'bg-[#1E1E1E]/95 backdrop-blur-md',
          border: 'border-[#2D2D2D]',
          card: 'bg-[#1E1E1E] shadow-none border border-[#2D2D2D]',
          btnActive: 'bg-[#E0E0E0]/15 text-white',
          accent: 'text-[#8720BA]'
        };
      default:
        return {
          bg: 'bg-[#F5F5F7]',
          text: 'text-gray-900',
          navBg: 'bg-white/95 backdrop-blur-md',
          border: 'border-gray-100',
          card: 'bg-white shadow-sm border border-gray-100',
          btnActive: 'bg-[#3A20BA]/10 text-[#3A20BA]',
          accent: 'text-[#3A20BA]'
        };
    }
  };

  const classes = getThemeClasses();

  return (
    <main className={`min-h-screen ${classes.bg} ${classes.text} flex flex-col relative pb-36 transition-colors duration-300`}>
      {/* Top sticky header */}
      <div className={`${classes.navBg} px-4 py-3 flex items-center justify-between border-b ${classes.border} sticky top-0 z-50 transition-colors duration-300`}>
        <button 
          onClick={() => router.back()} 
          className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform bg-black/5 dark:bg-white/5`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold truncate max-w-[180px] px-2">{bookTitle}</span>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={handleToggleBookmark}
            className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform ${isBookmarked ? 'text-[#BA8720]' : ''}`}
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform ${showSettings ? classes.btnActive : ''}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings overlay sheet */}
      {showSettings && (
        <div className={`mx-auto max-w-md w-full p-4 border-b ${classes.border} ${classes.card} flex flex-col gap-4 animate-in slide-in-from-top duration-200`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reader Mode Options</span>
            <button onClick={handleShare} className="flex items-center gap-1 text-xs font-bold text-[#3A20BA] dark:text-[#8720BA]">
              <Share2 className="w-4 h-4" /> Share Progress
            </button>
          </div>
          
          {/* Zoom controls */}
          <div className="flex items-center justify-between py-1 border-b border-dashed border-gray-200 dark:border-gray-800">
            <span className="text-xs font-bold">Zoom Level</span>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setZoom(z => Math.max(0.6, z - 0.1))}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button 
                onClick={() => setZoom(z => Math.min(2.0, z + 0.1))}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Theme selector */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">Paper Style</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setTheme('light')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 ${theme === 'light' ? 'bg-white text-gray-900 border-gray-300 shadow-sm' : 'bg-gray-100 text-gray-500 border-transparent dark:bg-gray-800'}`}
              >
                <Sun className="w-3.5 h-3.5" /> Light
              </button>
              <button 
                onClick={() => setTheme('sepia')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 ${theme === 'sepia' ? 'bg-[#FAF6EE] text-[#433422] border-[#E6DBC4] shadow-sm' : 'bg-gray-100 text-gray-500 border-transparent dark:bg-gray-800'}`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Sepia
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 ${theme === 'dark' ? 'bg-[#1E1E1E] text-[#E0E0E0] border-[#2D2D2D] shadow-sm' : 'bg-gray-100 text-gray-500 border-transparent dark:bg-gray-800'}`}
              >
                <Moon className="w-3.5 h-3.5" /> Night
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 max-w-md mx-auto w-full flex flex-col items-center justify-center pt-4 px-4 overflow-x-auto select-none">
        {loading && (
          <div className="flex flex-col items-center justify-center mt-32 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#3A20BA]" />
            <p className="text-xs font-bold">Parsing PDF pages...</p>
          </div>
        )}

        {error && (
          <div className="mt-32 p-6 rounded-2xl bg-red-50 border border-red-100 text-red-500 text-xs font-bold max-w-xs text-center shadow-sm">
            {error}
          </div>
        )}

        {/* PDF Canvas Container */}
        <div className={`relative ${loading || error ? 'hidden' : 'block'} ${classes.card} rounded-2xl overflow-hidden shadow-lg p-2 transition-transform duration-200`}>
          <canvas ref={canvasRef} className="max-w-full block" />
        </div>
      </div>

      {/* Persistent reader control sheet */}
      {!loading && !error && (
        <div className={`${classes.navBg} border-t ${classes.border} px-6 py-4 flex flex-col gap-4 fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors duration-300`}>
          {/* Progress Slider bar */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono font-bold w-8 text-gray-400">{currentPage}</span>
            <div className="flex-1 h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden relative">
              <div className="absolute top-0 left-0 bottom-0 bg-[#3A20BA] dark:bg-[#8720BA]" style={{ width: numPages ? `${(currentPage / numPages) * 100}%` : '0%' }}></div>
              <input 
                type="range" 
                min="1" 
                max={numPages || 1} 
                value={currentPage} 
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={!numPages}
              />
            </div>
            <span className="text-[10px] font-mono font-bold w-8 text-right text-gray-400">{numPages || '-'}</span>
          </div>
          
          {/* Back & Forth controls */}
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 text-sm font-bold disabled:opacity-30 active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-5 h-5" /> Prev
            </button>
            <span className="text-xs font-bold font-mono">
              Page {currentPage} of {numPages || '-'}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(numPages || 1, p + 1))}
              disabled={currentPage === (numPages || 1)}
              className="flex items-center gap-2 text-sm font-bold text-[#3A20BA] dark:text-[#8720BA] disabled:opacity-30 active:scale-95 transition-transform"
            >
              Next <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
