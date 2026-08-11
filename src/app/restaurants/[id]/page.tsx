import Link from "next/link";
import { notFound } from "next/navigation";
import { getHoursStatus, metaLine } from "@/lib/hours-status";
import { createServiceClient } from "@/lib/supabase/server";
import type { RestaurantWithImages } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function ActionTile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-[#ece4d8] bg-white text-[#3a342c] shadow-[0_1px_0_rgba(47,42,36,0.04)]"
    >
      <span className="text-[#4a433a]">{children}</span>
      <span className="text-[10px] font-semibold tracking-[0.12em]">{label}</span>
    </button>
  );
}

export default async function RestaurantDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*, restaurant_images(*)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const restaurant = data as RestaurantWithImages;
  const main =
    restaurant.restaurant_images?.find((img) => img.is_main) ??
    restaurant.restaurant_images?.[0];

  const cuisineLine = metaLine([
    ...(restaurant.tags ?? []).slice(0, 2),
    restaurant.cuisine,
  ]);
  const hoursLine = getHoursStatus(restaurant.hours);

  return (
    <div className="mx-auto min-h-full max-w-lg bg-[#f4eee4] text-[#2f2a24] pb-6">
      <section className="relative h-[42vh] min-h-[280px] overflow-hidden">
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={main.public_url}
            alt={restaurant.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[#d8cfc0]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/25" />
        <Link
          href="/"
          className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full bg-black/25 px-3 py-1.5 text-sm text-white backdrop-blur"
        >
          Back
        </Link>
        <div className="absolute inset-x-0 bottom-8 px-5 text-center">
          <h1 className="font-[family-name:var(--font-fraunces)] text-[2.6rem] leading-none font-medium tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
            {restaurant.name}
          </h1>
        </div>
      </section>

      <section className="relative -mt-4 rounded-t-[1.75rem] bg-[#f4eee4] px-5 pt-6">
        <div className="space-y-3 text-[15px] leading-snug text-[#4d463c]">
          {cuisineLine && (
            <p className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-[#6b6256]" aria-hidden>
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M7 3v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3" strokeLinecap="round" />
                  <path d="M9 13v8" strokeLinecap="round" />
                  <path d="M16 3v18" strokeLinecap="round" />
                  <path d="M16 3c2.2 2 2.2 5 0 7" strokeLinecap="round" />
                </svg>
              </span>
              <span>{cuisineLine}</span>
            </p>
          )}

          {(restaurant.address || restaurant.lat != null) && (
            <p className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-[#6b6256]" aria-hidden>
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
                  <circle cx="12" cy="11" r="2.2" />
                </svg>
              </span>
              <span>{restaurant.address ?? "Location saved"}</span>
            </p>
          )}

          <p className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0 text-[#6b6256]" aria-hidden>
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>{hoursLine}</span>
          </p>
        </div>

        {restaurant.description && (
          <p className="mt-5 text-[15px] leading-relaxed text-[#5a5247]">
            {restaurant.description}
          </p>
        )}

        <div className="mt-7 grid grid-cols-3 gap-3">
          <ActionTile label="MENU">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M8 3v10a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3" strokeLinecap="round" />
              <path d="M10 15v6" strokeLinecap="round" />
              <path d="M17 3v18" strokeLinecap="round" />
              <path d="M17 3c2.5 2.2 2.5 5.5 0 7.5" strokeLinecap="round" />
            </svg>
          </ActionTile>
          <ActionTile label="REVIEWS">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 4v-4H7.5A2.5 2.5 0 0 1 5 12.5v-6Z" strokeLinejoin="round" />
              <path d="m9.2 9.2.8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.8-1.6.8.3-1.8-1.3-1.2 1.8-.3.8-1.6Z" strokeLinejoin="round" />
            </svg>
          </ActionTile>
          <ActionTile label="SIMILAR PLACES">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M11 19s5-4.4 5-8.4a5 5 0 1 0-10 0c0 4 5 8.4 5 8.4Z" />
              <circle cx="11" cy="10.6" r="1.8" />
              <circle cx="17.5" cy="17.5" r="3" />
              <path d="m19.6 19.6 1.7 1.7" strokeLinecap="round" />
            </svg>
          </ActionTile>
        </div>
      </section>
    </div>
  );
}
