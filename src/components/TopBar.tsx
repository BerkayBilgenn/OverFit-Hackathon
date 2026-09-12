import { PatikaLogo } from "@/components/PatikaLogo";
import { cn } from "@/lib/cn";

const steps = [
  { id: "test", label: "Test", active: false, completed: true },
  { id: "result", label: "Sonuç", active: true, completed: false },
  { id: "compare", label: "Karşılaştır", active: false, completed: false },
] as const;

export function TopBar() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center border border-neutral-200 bg-white text-neutral-800">
            <PatikaLogo size={22} />
          </div>
          <div>
            <p className="text-pretty text-sm font-medium text-neutral-900">
              Patika
            </p>
            <p className="text-pretty text-xs text-neutral-500">
              Kariyer çizelgeni keşfet
            </p>
          </div>
        </div>

        <nav aria-label="Adımlar" className="flex items-center gap-2 text-sm">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <span
                className={cn(
                  "tabular-nums",
                  step.active && "font-medium text-neutral-900",
                  step.completed && !step.active && "text-neutral-600",
                  !step.active && !step.completed && "text-neutral-400",
                )}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <span aria-hidden className="text-neutral-300">
                  →
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
