import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-stone-100 text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link href="/admin" className="text-base font-semibold tracking-tight">
            Admin
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin/help-me-choose" className="text-stone-600">
              Picker
            </Link>
            <Link href="/" className="text-stone-600">
              Public
            </Link>
            <Link
              href="/admin/new"
              className="rounded-full bg-stone-900 px-3 py-1.5 font-medium text-white"
            >
              Add
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg px-4 py-5">{children}</main>
    </div>
  );
}
