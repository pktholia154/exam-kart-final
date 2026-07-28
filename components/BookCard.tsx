import { memo } from "react";
import { Star } from "lucide-react";
import Link from "next/link";
import { ProceduralCover } from "./ProceduralCover";
import { cn } from "@/lib/utils";

interface Book {
  id?: string;
  title: string;
  seoslug: string;
  category: string;
  buyprice: string;
  averageRating: number;
  seoDescription?: string;
}

interface BookCardProps {
  book: Book;
  layout?: "grid" | "list" | "rail";
  className?: string;
}

export const BookCard = memo(function BookCard({ book, layout = "grid", className }: BookCardProps) {
  const ratingText = Number(book.averageRating || 4.5).toFixed(1);

  if (layout === "list") {
    return (
      <Link href={`/book/${book.seoslug}`} className={cn("flex gap-4 py-3 items-center active:scale-[0.98] transition-transform border-b border-gray-50 last:border-0", className)}>
        <ProceduralCover title={book.title} className="w-[60px] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-[#8720BA] mb-0.5 uppercase tracking-wide truncate">{book.category}</p>
          <h3 className="text-xs font-bold text-gray-900 leading-tight mb-1 truncate">{book.title}</h3>
          {book.seoDescription && (
            <p className="text-[10px] text-gray-500 line-clamp-2 mb-1.5 leading-snug">{book.seoDescription}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-[#BA8720] text-[#BA8720]" />
              <span className="text-[10px] font-medium text-gray-700">{ratingText}</span>
            </div>
            <p className="text-xs font-bold text-gray-900">₹{book.buyprice}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/book/${book.seoslug}`} className={cn("flex flex-col gap-1 w-full active:scale-[0.98] transition-transform", className, layout === "rail" ? "w-[120px] shrink-0" : "")}>
      <ProceduralCover title={book.title} className="w-full" />
      <div className="flex flex-col mt-0.5">
        <p className="text-[8px] font-extrabold text-[#8720BA] uppercase tracking-wider truncate mb-0.5">{book.category}</p>
        <h3 className="text-[10px] font-bold text-gray-900 leading-tight line-clamp-2 mb-0.5">{book.title}</h3>
        <div className="flex items-center justify-between mt-auto">
          <p className="text-[10px] font-black text-gray-900">₹{book.buyprice}</p>
          <div className="flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-[#BA8720] text-[#BA8720]" />
            <span className="text-[8px] font-semibold text-gray-600">{ratingText}</span>
          </div>
        </div>
      </div>
    </Link>
  );
});
