export function calcStepNumbers(nodes: any[], edges: any[]) {
  // Build graph
  const graph = new Map();
  const indegree = new Map();

  nodes.forEach((n) => {
    graph.set(n.id, []);
    indegree.set(n.id, 0);
  });

  edges.forEach((e) => {
    // Safety check: only process edges where both source and target exist
    if (graph.has(e.source) && graph.has(e.target)) {
      graph.get(e.source).push(e.target);
      indegree.set(e.target, indegree.get(e.target) + 1);
    }
  });

  // Queue for topo sort (start with nodes that have no incoming edges)
  const queue = [];
  indegree.forEach((count, id) => {
    if (count === 0) queue.push(id);
  });

  const order = {};
  let step = 0;

  while (queue.length) {
    const id = queue.shift();
    order[id] = step;
    step++;

    // Safety check: ensure node exists in graph
    const neighbors = graph.get(id);
    if (neighbors) {
      neighbors.forEach((next) => {
        indegree.set(next, indegree.get(next) - 1);
        if (indegree.get(next) === 0) queue.push(next);
      });
    }
  }

  return order;
}
