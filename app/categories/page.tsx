"use client";

export default function CategoriesPage() {
  return (
    <main className="min-h-screen pt-4 pb-8 max-w-md mx-auto px-4">
      <h1 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">Browse Categories</h1>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center aspect-video active:scale-95 transition-transform">
            <h3 className="text-sm font-bold text-[#3A20BA]">Category {i + 1}</h3>
            <p className="text-[10px] text-gray-500 mt-1 font-medium">{((i * 13) % 40) + 10} Books</p>
          </div>
        ))}
      </div>
    </main>
  );
}
