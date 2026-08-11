export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-stone-100 text-stone-900">
      <main className="mx-auto w-full max-w-lg px-4 py-5">{children}</main>
    </div>
  );
}
