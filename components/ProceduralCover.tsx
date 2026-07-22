import { cn } from "@/lib/utils";

interface ProceduralCoverProps {
  title: string;
  className?: string;
}

export function ProceduralCover({ title, className }: ProceduralCoverProps) {
  // Generate a short 2-3 letter monogram from the title
  const monogram = title
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-[#3A20BA] overflow-hidden shadow-sm aspect-[2/3]",
        "rounded-l-sm rounded-tr-2xl rounded-br-sm",
        className
      )}
    >
      <span className="text-white font-bold text-2xl tracking-wider select-none">
        {monogram || "BK"}
      </span>
      {/* Subtle page fold effect on the right edge */}
      <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-l from-black/10 to-transparent" />
      <div className="absolute top-0 left-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent opacity-50" />
    </div>
  );
}
