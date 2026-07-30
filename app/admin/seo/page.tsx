"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Send, Globe, FileText, Sparkles } from "lucide-react";

export default function AdminSEODashboard() {
  const [formData, setFormData] = useState({
    title: "SBI PO Prelims 2026 Complete Solved Question Bank",
    seoslug: "sbi-po-prelims-2026-solved-papers",
    category: "Banking Exams",
    publisher: "Exam Kart Press",
    pdfurl: "https://pdfobject.com/pdf/sample.pdf",
    sampleurl: "https://pdfobject.com/pdf/sample.pdf",
    listprice: "299",
    buyprice: "149",
    seoDescription: "Download SBI PO Prelims 2026 solved question bank with detailed explanations, quantitative aptitude tricks, and reasoning mock papers.",
    fullDescription: "Master SBI PO Prelims 2026 with 15 full-length mock papers, memory-based question solutions from past 10 years, speed math formulas, and high-level puzzle solving techniques.",
    tags: "sbi po, banking, prelims, solved papers, 2026",
  });

  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);

  const [purgeUrl, setPurgeUrl] = useState("https://exam-kart.com/book/sbi-po-prelims-2026-solved-papers");
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<any>(null);

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    setPublishResult(null);

    try {
      const res = await fetch("/api/seo/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map((t) => t.trim()),
        }),
      });

      const data = await res.json();
      setPublishResult(data);
    } catch (err: any) {
      setPublishResult({
        success: false,
        message: "Network Error",
        errors: [err.message],
      });
    } finally {
      setPublishing(false);
    }
  };

  const handlePurgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurging(true);
    setPurgeResult(null);

    try {
      const res = await fetch("/api/seo/purge-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: [purgeUrl],
        }),
      });

      const data = await res.json();
      setPurgeResult(data);
    } catch (err: any) {
      setPurgeResult({
        success: false,
        message: err.message,
      });
    } finally {
      setPurging(false);
    }
  };

  return (
    <main className="min-h-screen pt-4 pb-16 max-w-2xl mx-auto px-4 bg-white text-xs">
      {/* Top Navigation */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            SEO & Automated Publishing Workflow
          </h1>
          <p className="text-[11px] text-gray-500 font-medium">
            Validate metadata, auto-generate clean URLs, regenerate pages & purge Cloudflare CDN cache
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Quick Info Banner */}
        <div className="bg-gradient-to-r from-[#3A20BA] to-[#2053BA] text-white p-4 rounded-2xl shadow-md space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-300" /> Automated SEO & Cache Purge Pipeline
          </div>
          <p className="text-[11px] text-white/80 leading-relaxed">
            Every submission validates title length, description constraints, and clean URL slugs before saving to Firestore (&apos;pdfbooks&apos;). Upon publication, Next.js paths are revalidated instantly and Cloudflare CDN caches are purged.
          </p>
        </div>

        {/* Section 1: Automated Book Publisher & Validator */}
        <section className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
            <Send className="w-4 h-4 text-[#3A20BA]" /> Validate & Publish Book
          </h2>

          <form onSubmit={handlePublishSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Book Title * (20-100 chars)
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#3A20BA]"
              />
              <span className="text-[10px] text-gray-400 font-mono">
                Chars: {formData.title.length} / 100
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Clean SEO Slug
                </label>
                <input
                  type="text"
                  value={formData.seoslug}
                  onChange={(e) => setFormData({ ...formData, seoslug: e.target.value })}
                  placeholder="e.g. sbi-po-mains-2026"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#3A20BA]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#3A20BA]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                SEO Meta Description * (40-300 chars)
              </label>
              <textarea
                required
                rows={2}
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#3A20BA] resize-none"
              />
              <span className="text-[10px] text-gray-400 font-mono">
                Chars: {formData.seoDescription.length} / 300
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Buy Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.buyprice}
                  onChange={(e) => setFormData({ ...formData, buyprice: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#3A20BA]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  List Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.listprice}
                  onChange={(e) => setFormData({ ...formData, listprice: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#3A20BA]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#3A20BA]"
              />
            </div>

            <button
              type="submit"
              disabled={publishing}
              className="w-full py-3 bg-[#3A20BA] text-white rounded-xl text-xs font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {publishing ? "Validating & Publishing..." : "Publish & Purge Cache"}
            </button>
          </form>

          {/* Result Output */}
          {publishResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                publishResult.success
                  ? "bg-[#53BA20]/10 border-[#53BA20]/30 text-gray-800"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {publishResult.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#53BA20]" /> Published Successfully!
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" /> Validation Error
                  </>
                )}
              </div>

              {publishResult.success ? (
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <p>
                    <strong>Clean URL:</strong>{" "}
                    <a
                      href={publishResult.publishedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#3A20BA] font-bold underline"
                    >
                      {publishResult.publishedUrl}
                    </a>
                  </p>
                  <p>
                    <strong>Revalidated Next.js SSR Cache:</strong> Yes (Home, Category, Book, Sitemap)
                  </p>
                  <p>
                    <strong>Cloudflare CDN Purge Status:</strong>{" "}
                    {publishResult.cloudflareCachePurged ? "Success" : "Failed / Skipped"}
                  </p>
                </div>
              ) : (
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  {publishResult.errors?.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* Section 2: Targeted Cache Purging */}
        <section className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#2053BA]" /> Targeted Cloudflare & SSR Cache Purging
          </h2>

          <form onSubmit={handlePurgeSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Target Page URL to Purge
              </label>
              <input
                type="url"
                required
                value={purgeUrl}
                onChange={(e) => setPurgeUrl(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#2053BA]"
              />
            </div>

            <button
              type="submit"
              disabled={purging}
              className="w-full py-2.5 bg-[#2053BA] text-white rounded-xl text-xs font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {purging ? "Purging Cache..." : "Purge URL Cache Now"}
            </button>
          </form>

          {purgeResult && (
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-[11px] font-mono space-y-1">
              <p>
                <strong>Status:</strong> {purgeResult.success ? "200 OK" : "Failed"}
              </p>
              <p>
                <strong>Revalidated Paths:</strong>{" "}
                {purgeResult.revalidatedPaths?.join(", ") || "None"}
              </p>
            </div>
          )}
        </section>

        {/* Section 3: Live Sitemaps & Search Engine Endpoints */}
        <section className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#8720BA]" /> Indexing & Sitemap Endpoints
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-bold text-gray-800">Dynamic XML Sitemap</span>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="text-[#3A20BA] font-bold underline"
              >
                /sitemap.xml
              </a>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-bold text-gray-800">XML Sitemap Index</span>
              <a
                href="/sitemap-index.xml"
                target="_blank"
                rel="noreferrer"
                className="text-[#3A20BA] font-bold underline"
              >
                /sitemap-index.xml
              </a>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-bold text-gray-800">Robots Directive File</span>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noreferrer"
                className="text-[#3A20BA] font-bold underline"
              >
                /robots.txt
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
