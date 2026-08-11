type ChevronProps = {
  direction?: "left" | "right";
  className?: string;
};

export function ChevronIcon({
  direction = "right",
  className = "h-4 w-4",
}: ChevronProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d={direction === "right" ? "M6 3.5l4.5 4.5L6 12.5" : "M10 3.5L5.5 8 10 12.5"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
