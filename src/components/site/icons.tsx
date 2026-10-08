import type { SVGProps } from "react";

/** Thin-line icons drawn to match the header's hairline weight. Decorative: callers label the control. */

export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      {/* A four-point star with long, slightly concave arms. */}
      <path d="M12 0 C12.7 7.6 16.4 11.3 24 12 C16.4 12.7 12.7 16.4 12 24 C11.3 16.4 7.6 12.7 0 12 C7.6 11.3 11.3 7.6 12 0 Z" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.4 15.4 21 21" strokeLinecap="round" />
    </svg>
  );
}

export function BagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M4.5 8.5h15l-1.2 12.5H5.7L4.5 8.5Z" strokeLinejoin="round" />
      <path d="M8.5 10.5V6.8a3.5 3.5 0 0 1 7 0v3.7" strokeLinecap="round" />
    </svg>
  );
}
