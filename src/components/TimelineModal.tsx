import * as Dialog from "@radix-ui/react-dialog";
import type { TimelineNode } from "@/data/types";
import { cn } from "@/lib/cn";

interface TimelineModalProps {
  node: TimelineNode;
  selectedChoiceId?: string;
  onSelect: (choiceId: string) => void;
  onClose: () => void;
}

export function TimelineModal({
  node,
  selectedChoiceId,
  onSelect,
  onClose,
}: TimelineModalProps) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-neutral-900/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border border-neutral-200 bg-white p-0 focus:outline-none">
          <div className="border-b border-neutral-200 px-6 py-5">
            <Dialog.Description className="text-xs uppercase text-neutral-500">
              {node.phase}
            </Dialog.Description>
            <Dialog.Title className="mt-1 text-balance text-lg font-medium text-neutral-900">
              {node.title}
            </Dialog.Title>
            <p className="mt-2 text-pretty text-sm text-neutral-600">
              {node.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 px-6 py-5">
            <p className="text-sm text-neutral-700">Bir seçenek belirleyin:</p>
            {node.choices?.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => onSelect(choice.id)}
                className={cn(
                  "border px-4 py-3 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
                  selectedChoiceId === choice.id
                    ? "border-neutral-900 bg-neutral-50"
                    : "border-neutral-200 bg-white",
                )}
              >
                <span className="block text-sm font-medium text-neutral-900">
                  {choice.label}
                </span>
                <span className="mt-1 block text-pretty text-xs text-neutral-500">
                  {choice.description}
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-neutral-200 px-6 py-4">
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-sm text-neutral-500 transition-colors hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                Kapat
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
