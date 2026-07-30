'use client';

import Link from "next/link";
import { Search } from "lucide-react";
import { motion } from "motion/react";

export function SearchBarAnimated() {
  return (
    <Link href="/search" className="block w-full group">
      <motion.div 
        className="relative flex items-center w-full bg-gray-50 border border-gray-200/80 rounded-full py-3 pl-10 pr-4 text-sm font-medium text-gray-500 shadow-sm"
        animate={{ 
          scale: [1, 1.02, 1],
          boxShadow: [
            "0px 1px 2px rgba(0,0,0,0.05)",
            "0px 4px 12px rgba(58, 32, 186, 0.15)",
            "0px 1px 2px rgba(0,0,0,0.05)"
          ],
          borderColor: [
            "rgba(229, 231, 235, 0.8)",
            "rgba(58, 32, 186, 0.3)",
            "rgba(229, 231, 235, 0.8)"
          ]
        }}
        transition={{ 
          duration: 2.5, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
      >
        <Search className="absolute left-3.5 w-4 h-4 text-[#2053BA] opacity-70" />
        <span className="text-gray-600">Search books, exams, authors...</span>
      </motion.div>
    </Link>
  );
}
