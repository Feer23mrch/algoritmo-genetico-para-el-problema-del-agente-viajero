// ============================================================
//  dijkstra.js  –  Algoritmo de Dijkstra con Min-Heap (PriorityQueue)
//  Retorna: { distancia, ruta }
// ============================================================

/** Cola de prioridad mínima simple */
class MinHeap {
  constructor() { this.heap = []; }

  push(node) {
    this.heap.push(node);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  get size() { return this.heap.length; }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].dist <= this.heap[i].dist) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l].dist < this.heap[smallest].dist) smallest = l;
      if (r < n && this.heap[r].dist < this.heap[smallest].dist) smallest = r;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}

/**
 * Construye lista de adyacencia a partir de las conexiones.
 * @param {string[]} nodos  - IDs de departamentos
 * @param {Array}    aristas - [origen, destino, peso]
 */
function buildGraph(nodos, aristas) {
  const graph = {};
  nodos.forEach(n => (graph[n] = []));
  aristas.forEach(([u, v, w]) => {
    graph[u].push({ to: v, weight: w });
    graph[v].push({ to: u, weight: w }); // no-dirigido
  });
  return graph;
}

/**
 * Dijkstra.
 * @param {Object} graph  - Lista de adyacencia
 * @param {string} origen - Nodo inicio
 * @param {string} destino- Nodo fin
 * @returns {{ distancia: number, ruta: string[] }}
 */
function dijkstra(graph, origen, destino) {
  const dist = {};
  const prev = {};
  Object.keys(graph).forEach(n => {
    dist[n] = Infinity;
    prev[n] = null;
  });
  dist[origen] = 0;

  const pq = new MinHeap();
  pq.push({ node: origen, dist: 0 });

  while (pq.size > 0) {
    const { node: u, dist: d } = pq.pop();
    if (d > dist[u]) continue; // nodo obsoleto
    if (u === destino) break;

    for (const { to: v, weight } of graph[u]) {
      const newDist = dist[u] + weight;
      if (newDist < dist[v]) {
        dist[v] = newDist;
        prev[v] = u;
        pq.push({ node: v, dist: newDist });
      }
    }
  }

  // Reconstruir ruta
  const ruta = [];
  let current = destino;
  while (current !== null) {
    ruta.unshift(current);
    current = prev[current];
  }

  if (ruta[0] !== origen) {
    return { distancia: Infinity, ruta: [] }; // sin ruta
  }

  return { distancia: dist[destino], ruta };
}

export { buildGraph, dijkstra };