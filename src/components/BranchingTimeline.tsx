import type { TimelineData } from "@/data/types";
import { useTimeline } from "@/hooks/useTimeline";
import { cn } from "@/lib/cn";
import { TimelineModal } from "./TimelineModal";

interface BranchingTimelineProps {
  timeline: TimelineData;
}

export function BranchingTimeline({ timeline }: BranchingTimelineProps) {
  const {
    nodes,
    modalNode,
    openModal,
    closeModal,
    selectChoice,
    choices,
  } = useTimeline(timeline);

  return (
    <section aria-labelledby="timeline-heading">
      <h2
        id="timeline-heading"
        className="text-balance text-lg font-medium text-neutral-900"
      >
        Dallanan hikaye
      </h2>
      <p className="mt-1 text-pretty text-sm text-neutral-500">
        Seçimleriniz kariyer yolunuzu değiştirir. Noktalara tıklayarak
        alternatifleri keşfedin.
      </p>

      <ol className="relative mt-8 space-y-0">
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;
          const isPast = node.displayStatus === "past";
          const isCurrent = node.displayStatus === "current";
          const canInteract =
            node.interactive && node.choices && node.choices.length > 0;

          return (
            <li key={node.id} className="relative flex gap-4 pb-10 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[11px] top-6 h-[calc(100%-12px)] w-px",
                    isPast ? "bg-neutral-400" : "bg-neutral-200",
                  )}
                />
              )}

              <button
                type="button"
                disabled={!canInteract}
                onClick={() => canInteract && openModal(node.id)}
                aria-label={
                  canInteract
                    ? `${node.title} — seçim yap`
                    : node.title
                }
                className={cn(
                  "relative z-10 mt-1 size-6 shrink-0 border-2 bg-white transition-colors",
                  isPast && "border-neutral-900 bg-neutral-900",
                  isCurrent && "border-neutral-900",
                  !isPast && !isCurrent && "border-neutral-200",
                  canInteract && "cursor-pointer hover:border-neutral-600",
                  !canInteract && "cursor-default",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
                )}
              />

              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs uppercase text-neutral-500">
                  {node.phase}
                </p>
                <p className="mt-0.5 text-pretty text-sm font-medium text-neutral-900">
                  {node.title}
                </p>
                <p className="mt-1 text-pretty text-sm text-neutral-500">
                  {node.description}
                </p>
                {choices[node.id] && node.choices && (
                  <p className="mt-2 text-pretty text-xs text-neutral-600">
                    Seçim:{" "}
                    {
                      node.choices.find((c) => c.id === choices[node.id])
                        ?.label
                    }
                  </p>
                )}
                {canInteract && !choices[node.id] && (
                  <p className="mt-2 text-pretty text-xs text-neutral-400">
                    Seçim yapmak için tıklayın
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {modalNode && modalNode.choices && (
        <TimelineModal
          node={modalNode}
          selectedChoiceId={choices[modalNode.id]}
          onSelect={(choiceId) => selectChoice(modalNode.id, choiceId)}
          onClose={closeModal}
        />
      )}
    </section>
  );
}
