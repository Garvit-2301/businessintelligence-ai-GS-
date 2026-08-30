import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost" | "paper" | "alert";
  size?: "sm" | "md";
};

export function Button({ className, variant = "solid", size = "md", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        variant === "solid" && "bg-brass text-ink hover:bg-brass-2",
        variant === "ghost" && "border border-white/12 text-paper hover:bg-white/6",
        variant === "paper" && "bg-ink text-paper hover:bg-ink-2",
        variant === "alert" && "bg-alert text-paper hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
}
