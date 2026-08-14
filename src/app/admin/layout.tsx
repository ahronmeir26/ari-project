import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-stone-100 text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/admin"
            className="text-base font-semibold tracking-tight text-stone-900"
          >
            Restaurants
          </Link>
          <Link
            href="/"
            className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700"
          >
            Home
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg px-4 py-5">{children}</main>
    </div>
  );
}
