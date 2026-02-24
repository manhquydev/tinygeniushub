/**
 * Minimal inline SVG icon set — monochrome outline style (Feather-inspired).
 * No external dependency. All icons use `currentColor` for theming.
 */

type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

function svg(children: React.ReactNode, { size = 16, className = "", strokeWidth = 2 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconCheckCircle(props: IconProps) {
  return svg(
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4 12 14.01l-3-3" />
    </>,
    props
  );
}

export function IconCheck(props: IconProps) {
  return svg(<path d="M20 6 9 17l-5-5" />, props);
}

export function IconInfo(props: IconProps) {
  return svg(
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </>,
    props
  );
}

export function IconChevronDown(props: IconProps) {
  return svg(<path d="m6 9 6 6 6-6" />, props);
}
