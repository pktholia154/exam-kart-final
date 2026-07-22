"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const PDFReader = dynamic(() => import('@/components/PDFReader'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-[#3A20BA]">
      <Loader2 className="w-8 h-8 animate-spin mb-4" />
      <span className="text-sm font-bold">Initializing Reader...</span>
    </div>
  )
});

export default function ReaderPage() {
  return <PDFReader />;
}

