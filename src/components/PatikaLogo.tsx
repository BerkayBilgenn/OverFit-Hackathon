import { cn } from "@/lib/cn";

interface PatikaLogoProps {
  className?: string;
  size?: number;
  variant?: "icon" | "full";
}

/**
 * Modern Patika logosu: yukarı doğru yükselen kariyer yolu.
 * Geçmiş noktalar dolu, gelecek noktalar boş; dallanan yol seçimleri temsil eder.
 */
export function PatikaLogo({
  className,
  size = 32,
  variant = "icon",
}: PatikaLogoProps) {
  if (variant === "full") {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <PatikaIcon size={size} />
        <span className="text-sm font-medium text-neutral-900">Patika</span>
      </span>
    );
  }

  return <PatikaIcon size={size} className={className} />;
}

function PatikaIcon({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      {/* Ana yol */}
      <path
        d="M10 26V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Dallanan yol */}
      <path
        d="M10 18L22 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Geçmiş — dolu */}
      <circle cx="10" cy="26" r="3" fill="currentColor" />
      <circle cx="10" cy="18" r="3" fill="currentColor" />

      {/* Gelecek — boş */}
      <circle
        cx="10"
        cy="10"
        r="2.5"
        fill="white"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="22"
        cy="12"
        r="2.5"
        fill="white"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
