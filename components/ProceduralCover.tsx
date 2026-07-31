import { cn } from "@/lib/utils";

interface ProceduralCoverProps {
  title: string;
  className?: string;
}

export function ProceduralCover({ title, className }: ProceduralCoverProps) {
  // Extract 2 letters from title
  const cleanTitle = (title || "").trim();
  const words = cleanTitle.split(/\s+/).filter(Boolean);
  let monogram = "";
  if (words.length >= 2) {
    monogram = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    monogram = words[0].slice(0, 2).toUpperCase();
  } else if (words.length === 1) {
    monogram = (words[0][0] + "B").toUpperCase();
  } else {
    monogram = "CA";
  }

  return (
    <div
      className={cn(
        "@container relative flex bg-gradient-to-br from-[#2d64d9] via-[#2053BA] to-[#143e99] overflow-hidden shadow-md aspect-[2/3.4] select-none rounded-[2px]",
        className
      )}
    >
      {/* Top-Right White Background (Cut Corner Simulation) */}
      <div className="absolute top-0 right-0 w-[28%] aspect-square z-10 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="0,0 100,0 100,100" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Top-Right White Folded Page Corner (Dog Ear) */}
      <div className="absolute top-0 right-0 w-[28%] aspect-square z-20 pointer-events-none">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full filter drop-shadow-[-2px_2px_3px_rgba(0,0,0,0.4)]"
        >
          {/* Turned-over white flap */}
          <polygon points="0,0 100,100 0,100" fill="#FFFFFF" />
          <polygon points="0,0 100,100 0,100" fill="url(#fold-shading)" />
          <defs>
            <linearGradient id="fold-shading" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="100%" stopColor="#D2D2D2" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Left Margin 7 Binder Hole Punches */}
      <div className="absolute left-[6%] top-[5%] bottom-[5%] w-[9%] flex flex-col justify-between items-center z-10 pointer-events-none">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="w-full aspect-square rounded-full bg-gradient-to-b from-[#111111] to-[#2e2e2e] shadow-[inset_1px_1px_2.5px_rgba(0,0,0,0.95)] border border-black/60"
          />
        ))}
      </div>

      {/* PDF Acrobat Background Icon (Subtle watermark) */}
      <div className="absolute inset-0 flex items-center justify-center p-1 z-0 pointer-events-none opacity-25 overflow-hidden">
        <svg
          viewBox="0 0 200 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[130%] h-[130%] transform translate-x-[6%] translate-y-[2%]"
        >
          <path
            d="M 125 35 C 155 35, 175 60, 160 100 C 140 150, 110 200, 75 250 C 50 285, 25 270, 25 235 C 25 185, 80 165, 135 165 C 165 165, 185 180, 175 210 C 165 240, 125 260, 80 250 C 45 242, 20 220, 25 190 C 30 160, 65 125, 105 85 C 120 70, 135 55, 125 35 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* 2 Letters Monogram Box in Right Bottom */}
      <div className="absolute right-[8%] bottom-[8%] z-10 pointer-events-none">
        <div className="border border-white/50 bg-white/10 backdrop-blur-[1px] px-[12cqw] py-[6cqw] flex items-center justify-center rounded-[2px] shadow-sm">
          <span className="text-white font-extrabold text-[24cqw] leading-none tracking-widest select-none text-center drop-shadow-sm font-sans">
            {monogram}
          </span>
        </div>
      </div>
    </div>
  );
}

