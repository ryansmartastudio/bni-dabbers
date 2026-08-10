import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-bni text-white hover:bg-bni-dark",
        variant === "secondary" &&
          "border border-border bg-white text-foreground hover:bg-surface-muted",
        variant === "danger" && "bg-bni text-white hover:bg-bni-dark",
        variant === "ghost" && "text-foreground hover:bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}
