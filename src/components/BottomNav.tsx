"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/search",
    label: "Search",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/favorites",
    label: "Favorites",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path
          d="M12 20s-6.5-4.2-8.5-8A4.8 4.8 0 0 1 12 7.2 4.8 4.8 0 0 1 20.5 12c-2 3.8-8.5 8-8.5 8Z"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19.2a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border-beige bg-surface/95 backdrop-blur">
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/" || pathname.startsWith("/restaurants")
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 text-[10px] ${
                active ? "text-foreground" : "text-muted-beige"
              }`}
            >
              {item.icon}
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
