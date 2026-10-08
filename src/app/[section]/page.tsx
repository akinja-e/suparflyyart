import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/SiteHeader";
import { HOME_ROUTE, NAV_ALL } from "@/lib/site/nav";

/** Only the six known sections exist; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return NAV_ALL.map((item) => ({ section: item.slug }));
}

type Props = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  const item = NAV_ALL.find((n) => n.slug === section);
  return { title: item ? `${item.label} — SUPARFLYY` : "SUPARFLYY" };
}

/**
 * Placeholder for each header section (Shop, Collections, Art, Story, Journal,
 * Contact) until its real page is built — so the navigation never dead-ends.
 */
export default async function SectionPage({ params }: Props) {
  const { section } = await params;
  const item = NAV_ALL.find((n) => n.slug === section);
  if (!item) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-dvh flex-col items-center justify-center bg-stone px-6 pt-[3.75rem] text-center">
        <p className="font-ui text-[0.65rem] font-medium uppercase tracking-[0.32em] text-ink/60">Opening soon</p>
        <h1 className="mt-6 font-serif text-[clamp(3rem,9vw,7rem)] font-normal uppercase leading-none tracking-[0.3em] text-ink [margin-right:-0.3em]">
          {item.label}
        </h1>
        <p className="mt-6 max-w-md font-serif text-xl text-ink/75">{item.blurb}</p>
        <Link
          href={HOME_ROUTE}
          className="mt-12 font-ui text-[0.65rem] font-medium uppercase tracking-[0.32em] text-ink underline-offset-8 hover:underline"
        >
          Back home
        </Link>
      </main>
    </>
  );
}
