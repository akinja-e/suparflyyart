"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import {
  HOME_ROUTE,
  NAV_ALL,
  NAV_LEFT,
  NAV_RIGHT,
  type NavItem,
} from "@/lib/site/nav";
import { useUIStore } from "@/store/ui";
import { BagIcon, SearchIcon, SparkleIcon } from "./icons";

/** Height of the bar, shared with layouts that sit beneath it. */
export const HEADER_HEIGHT = "3.75rem";

function NavLink({ item }: { item: NavItem }) {
  return (
    <Link
      href={`/${item.slug}`}
      className="font-ui text-[0.625rem] font-medium uppercase tracking-[0.28em] text-ink transition-opacity duration-300 hover:opacity-55"
    >
      {item.label}
    </Link>
  );
}

/**
 * The site bar from the mockup: sparkle mark · three links · SUPARFLYY · three
 * links · search and bag. Quiet warm-stone background, hairline underneath.
 *
 * Below the `lg` breakpoint the links fold into a menu opened by the sparkle,
 * leaving just the sparkle, the wordmark and the bag.
 */
export function SiteHeader() {
  const { menuOpen, setMenuOpen, setCartOpen } = useUIStore();
  const menuId = useId();
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const cartCount: number = 0; // Wired to the cart store in the cart phase.

  // Escape closes the menu; focus moves into it when it opens.
  useEffect(() => {
    if (!menuOpen) return;
    firstLinkRef.current?.focus();
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, setMenuOpen]);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-40 border-b border-ink/10 bg-stone/95 backdrop-blur-sm"
        style={{ height: HEADER_HEIGHT }}
      >
        {/*
        Three columns: [sparkle … left links] | wordmark | [right links … icons].
        The outer columns are equal (1fr each), so the wordmark is exactly centred;
        each link group hugs the wordmark at the same distance, as in the mockup.
      */}
        <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center px-5 lg:px-9">
          <div className="flex items-center">
            <button
              type="button"
              className="-m-2 p-2 text-ink transition-transform duration-500 hover:rotate-45 lg:pointer-events-none lg:hover:rotate-0"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <SparkleIcon className="h-[1.375rem] w-[1.375rem]" />
            </button>
            <nav
              aria-label="Primary"
              className="ml-auto hidden items-center gap-[clamp(1.75rem,3.1vw,3rem)] pr-[clamp(3rem,9.8vw,8.5rem)] lg:flex"
            >
              {NAV_LEFT.map((item) => (
                <NavLink key={item.slug} item={item} />
              ))}
            </nav>
          </div>

          <Link
            href={HOME_ROUTE}
            className="font-ui text-[1.15rem] font-semibold uppercase leading-none tracking-[0.02em] text-ink lg:text-[1.3rem]"
          >
            Suparflyy
          </Link>

          <div className="flex items-center">
            <nav
              aria-label="Secondary"
              className="hidden items-center gap-[clamp(1.75rem,3.1vw,3rem)] pl-[clamp(3rem,9.8vw,8.5rem)] lg:flex"
            >
              {NAV_RIGHT.map((item) => (
                <NavLink key={item.slug} item={item} />
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-5 lg:gap-7">
              <button
                type="button"
                className="-m-2 hidden p-2 text-ink transition-opacity hover:opacity-55 sm:block"
                aria-label="Search"
              >
                <SearchIcon className="h-[1.15rem] w-[1.15rem]" />
              </button>
              <button
                type="button"
                className="-m-2 flex items-center gap-2 p-2 text-ink transition-opacity hover:opacity-55"
                aria-label={`Bag, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
                onClick={() => setCartOpen(true)}
              >
                <BagIcon className="h-[1.2rem] w-[1.2rem]" />
                <span
                  className="font-ui text-[0.7rem] tracking-[0.12em]"
                  aria-hidden="true"
                >
                  ({cartCount})
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/*
        Small-screen menu: a quiet stone sheet below the bar. It lives outside
        <header> because the bar's backdrop blur would otherwise trap a fixed
        child inside the bar's own 3.75rem box.
      */}
      <div
        id={menuId}
        hidden={!menuOpen}
        className="fixed inset-x-0 bottom-0 z-40 bg-stone lg:hidden"
        style={{ top: HEADER_HEIGHT }}
      >
        <nav
          aria-label="Menu"
          className="menu-in flex h-full flex-col justify-center gap-7 px-8"
        >
          {NAV_ALL.map((item, i) => (
            <Link
              key={item.slug}
              ref={i === 0 ? firstLinkRef : undefined}
              href={`/${item.slug}`}
              onClick={() => setMenuOpen(false)}
              className="font-serif text-[2.4rem] uppercase leading-none tracking-[0.18em] text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
