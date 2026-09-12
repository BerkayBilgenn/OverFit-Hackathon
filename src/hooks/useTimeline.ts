import { useCallback, useMemo, useState } from "react";
import type { TimelineData, TimelineNode } from "@/data/types";

function buildVisibleNodes(
  data: TimelineData,
  choices: Record<string, string>,
): TimelineNode[] {
  const result: TimelineNode[] = [];

  function processSequence(nodeIds: string[]) {
    for (const nodeId of nodeIds) {
      const node = data.nodes[nodeId];
      if (!node) continue;

      result.push(node);

      const choiceId = choices[nodeId];
      if (choiceId) {
        const branch = data.branches.find(
          (b) => b.fromNodeId === nodeId && b.choiceId === choiceId,
        );
        if (branch) {
          processSequence(branch.nextNodeIds);
          return;
        }
      }
    }
  }

  processSequence(data.initialNodeIds);
  return result;
}

function deriveStatus(
  nodes: TimelineNode[],
  index: number,
): TimelineNode["status"] {
  const firstFutureIndex = nodes.findIndex((n) => n.status !== "past");
  if (firstFutureIndex === -1) return "past";
  if (index < firstFutureIndex) return "past";
  if (index === firstFutureIndex) return "current";
  return "future";
}

export function useTimeline(data: TimelineData) {
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [modalNodeId, setModalNodeId] = useState<string | null>(null);

  const visibleNodes = useMemo(
    () => buildVisibleNodes(data, choices),
    [data, choices],
  );

  const nodesWithStatus = useMemo(
    () =>
      visibleNodes.map((node, index) => ({
        ...node,
        displayStatus: deriveStatus(visibleNodes, index),
        selectedChoiceId: choices[node.id],
      })),
    [visibleNodes, choices],
  );

  const modalNode = modalNodeId ? data.nodes[modalNodeId] : null;

  const openModal = useCallback((nodeId: string) => {
    setModalNodeId(nodeId);
  }, []);

  const closeModal = useCallback(() => {
    setModalNodeId(null);
  }, []);

  const selectChoice = useCallback((nodeId: string, choiceId: string) => {
    setChoices((prev) => ({ ...prev, [nodeId]: choiceId }));
    setModalNodeId(null);
  }, []);

  return {
    nodes: nodesWithStatus,
    modalNode,
    openModal,
    closeModal,
    selectChoice,
    choices,
  };
}
