import type { IntroChoice } from "@/intro/IntroExperience";

type FlowPlaceholderProps = {
  choice: IntroChoice;
  onBack: () => void;
};

/**
 * Seçim sonrası geçilen boş sayfa.
 * TODO: Tercih formu akışı (arkadaşının yaptığı bölüm) buraya entegre edilecek.
 */
export function FlowPlaceholder({ choice, onBack }: FlowPlaceholderProps) {
  const label = choice === "withScore" ? "YKS Puanım Var" : "YKS Puanım Yok";

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#060d1f] px-6 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-red-400/90">
        Pusula
      </p>
      <h1 className="font-display mt-4 bg-gradient-to-b from-white via-slate-100 to-slate-500 bg-clip-text text-4xl font-bold tracking-wide text-transparent sm:text-5xl">
        {label}
      </h1>
      <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-slate-400 sm:text-base">
        Bu akış yakında burada olacak. Tercih formu bu sayfaya entegre
        edilecek.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-10 cursor-pointer rounded-full border border-slate-500/40 bg-slate-900/50 px-6 py-2.5 text-sm font-medium text-slate-300 transition-colors duration-200 hover:border-slate-300/60 hover:text-white"
      >
        ← Başa dön
      </button>
    </div>
  );
}
