"use client";

import { Home, Grid, BookOpen, User, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Categories", href: "/categories", icon: Grid },
  { name: "Cart", href: "/cart", icon: ShoppingCart },
  { name: "Purchased", href: "/purchased", icon: BookOpen },
  { name: "Profile", href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  if (pathname?.startsWith('/read')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-100 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md md:max-w-2xl mx-auto w-full px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center w-16 h-full space-y-1 relative"
            >
              <div
                className={cn(
                  "p-1.5 rounded-2xl transition-colors duration-200",
                  isActive ? "bg-[#2053BA]/10 text-[#2053BA]" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {item.name === "Cart" && totalItems > 0 && (
                  <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                    {totalItems}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-[#2053BA]" : "text-gray-400"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
