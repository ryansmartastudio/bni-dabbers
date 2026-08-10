import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        id={inputId}
        className={cn(
          "w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none ring-bni/20 transition focus:ring-2",
          error && "border-bni",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-bni">{error}</span> : null}
    </label>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <textarea
        id={inputId}
        className={cn(
          "min-h-24 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none ring-bni/20 transition focus:ring-2",
          error && "border-bni",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-bni">{error}</span> : null}
    </label>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { value: string; label: string }[];
};

export function Select({ label, options, className, id, ...props }: SelectProps) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <select
        id={inputId}
        className={cn(
          "w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none ring-bni/20 transition focus:ring-2",
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
