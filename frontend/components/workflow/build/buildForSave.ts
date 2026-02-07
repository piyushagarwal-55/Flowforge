import { buildForExecute } from "./buildForExecute";

export function buildForSave(nodes: any[], edges: any[]) {
  // ✅ DON'T use buildForExecute - it strips data!
  // Just save the nodes as-is with their full data
  
  return {
    workflowId: "workflow_" + Date.now(),
    ownerId: "user_" + Date.now(),
    steps: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data, // ✅ Preserve ALL node data
    })),
    edges, // ✅ preserve edges for mutations
  };
}
