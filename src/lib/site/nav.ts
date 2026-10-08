/**
 * Site sections. The header splits them either side of the wordmark, exactly
 * as in docs/design/home-mockup.jpg; the mobile menu lists them in order.
 */
export interface NavItem {
  slug: string;
  label: string;
  /** One-line description shown on the section's placeholder page. */
  blurb: string;
}

export const NAV_LEFT: NavItem[] = [
  { slug: "shop", label: "Shop", blurb: "Art pieces and collectible objects." },
  { slug: "collections", label: "Collections", blurb: "Series and limited drops, gathered by world." },
  { slug: "art", label: "Art", blurb: "Original works from the studio." },
];

export const NAV_RIGHT: NavItem[] = [
  { slug: "story", label: "Story", blurb: "Where SUPARFLYY comes from, and where it is going." },
  { slug: "journal", label: "Journal", blurb: "Notes, process and releases." },
  { slug: "contact", label: "Contact", blurb: "Commissions, stockists and press." },
];

export const NAV_ALL: NavItem[] = [...NAV_LEFT, ...NAV_RIGHT];

/** The home page (the room). The intro rain lives at "/". */
export const HOME_ROUTE = "/home";
