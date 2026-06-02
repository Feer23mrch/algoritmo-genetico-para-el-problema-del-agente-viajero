// ============================================================
//  app.js  –  Controlador principal
//  Conecta UI ↔ Dijkstra ↔ Google Maps
// ============================================================
import { DEPARTAMENTOS, CONEXIONES } from "./data.js";
import { buildGraph, dijkstra } from "./dijkstra.js";
import {
  initMap, drawAllEdges, drawAllMarkers,
  drawRoute, clearRoute, resetAllMarkers, setMarkerStyle,
} from "./map.js";
import { resolverTSPGenetico } from "./genetico_tsp.js";

// ── Grafo global ─────────────────────────────────────────────
const NODOS = Object.keys(DEPARTAMENTOS);
const graph = buildGraph(NODOS, CONEXIONES);

// ── Estado ───────────────────────────────────────────────────
let origen = null;
let destino = null;
let clickMode = "origen"; // "origen" | "destino"

// ── Poblar selects ───────────────────────────────────────────
function populateSelects() {
  const selectOrigen = document.getElementById("select-origen");
  const selectDestino = document.getElementById("select-destino");

  const sorted = NODOS.slice().sort((a, b) =>
    DEPARTAMENTOS[a].nombre.localeCompare(DEPARTAMENTOS[b].nombre)
  );

  sorted.forEach(id => {
    const dep = DEPARTAMENTOS[id];
    [selectOrigen, selectDestino].forEach(sel => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = `${dep.capital} (${dep.nombre})`;
      sel.appendChild(opt);
    });
  });

  selectOrigen.addEventListener("change", () => setOrigen(selectOrigen.value));
  selectDestino.addEventListener("change", () => setDestino(selectDestino.value));
}

// ── Setters ──────────────────────────────────────────────────
function setOrigen(id) {
  origen = id;
  document.getElementById("select-origen").value = id;
  updateUI();
}

function setDestino(id) {
  destino = id;
  document.getElementById("select-destino").value = id;
  updateUI();
}

function updateUI() {
  const btnBuscar = document.getElementById("btn-buscar");
  btnBuscar.disabled = !(origen && destino && origen !== destino);

  const tagOrigen = document.getElementById("tag-origen");
  const tagDestino = document.getElementById("tag-destino");
  tagOrigen.textContent = origen ? DEPARTAMENTOS[origen].capital : "—";
  tagDestino.textContent = destino ? DEPARTAMENTOS[destino].capital : "—";

  resetAllMarkers();
  clearRoute();
  clearResult();
  if (origen) setMarkerStyle(origen, "origen");
  if (destino) setMarkerStyle(destino, "destino");
}

// ── Buscar ruta (Dijkstra) ───────────────────────────────────
function buscarRuta() {
  if (!origen || !destino) return;

  const { distancia, ruta } = dijkstra(graph, origen, destino);

  if (ruta.length === 0 || distancia === Infinity) {
    showResult(null);
    return;
  }

  drawRoute(ruta);
  showResult({ ruta, distancia, esTSP: false });
}

// ── Mostrar resultado ────────────────────────────────────────
function showResult(data) {
  const panel = document.getElementById("result-panel");
  const rutaList = document.getElementById("result-ruta");
  const distSpan = document.getElementById("result-dist");

  panel.classList.remove("hidden");

  if (!data) {
    rutaList.innerHTML = `<li class="text-red-400">No existe ruta entre estos departamentos.</li>`;
    distSpan.textContent = "—";
    return;
  }

  // Diferenciamos la etiqueta si es la ruta del Agente Viajero (línea recta) o Dijkstra (carretera)
  distSpan.textContent = data.esTSP
    ? `${data.distancia.toLocaleString()} km (Línea recta)`
    : `${data.distancia.toLocaleString()} km`;

  rutaList.innerHTML = data.ruta
    .map((id, i) => {
      const dep = DEPARTAMENTOS[id];
      const isFirst = i === 0;
      const isLast = i === data.ruta.length - 1;

      // Icono de bandera a cuadros para el final del recorrido del TSP
      const icon = isFirst ? "🔵" : isLast ? (data.esTSP ? "🏁" : "🔴") : "🟡";

      let km = "";
      // Solo buscamos distancias parciales en CONEXIONES si es Dijkstra (!data.esTSP)
      if (i > 0 && !data.esTSP) {
        const prev = data.ruta[i - 1];
        const conn = CONEXIONES.find(
          ([u, v]) => (u === prev && v === id) || (v === prev && u === id)
        );
        if (conn) km = `<span class="text-amber-400 text-xs ml-1">(+${conn[2]} km)</span>`;
      }

      return `<li class="flex items-center gap-2 py-1 border-b border-blue-900/40 last:border-0">
                <span>${icon}</span>
                <span class="font-medium text-blue-100">${dep.capital}</span>
                <span class="text-blue-400 text-xs">${dep.nombre}</span>
                ${km}
              </li>`;
    })
    .join("");
}

function clearResult() {
  const panel = document.getElementById("result-panel");
  panel.classList.add("hidden");
}

// ── Clic en marcador del mapa ────────────────────────────────
function onMarkerClick(id) {
  if (!origen || clickMode === "origen") {
    setOrigen(id);
    clickMode = "destino";
  } else {
    setDestino(id);
    clickMode = "origen";
  }
}

// ── Inicialización global (llamada por Google Maps callback) ──
window.initApp = function () {
  initMap();
  drawAllEdges(CONEXIONES);
  drawAllMarkers(onMarkerClick);
  populateSelects();

  // Evento Dijkstra
  document.getElementById("btn-buscar").addEventListener("click", buscarRuta);

  // Evento Reset
  document.getElementById("btn-reset").addEventListener("click", () => {
    origen = null;
    destino = null;
    clickMode = "origen";
    document.getElementById("select-origen").value = "";
    document.getElementById("select-destino").value = "";
    resetAllMarkers();
    clearRoute();
    clearResult();
    updateUI();
  });

  // Evento Algoritmo Genético (Agente Viajero)
  document.getElementById("btn-tsp").addEventListener("click", () => {
    const btnTsp = document.getElementById("btn-tsp");
    const textoOriginal = btnTsp.textContent;
    btnTsp.textContent = "⚙️ Evolucionando...";

    // Usamos setTimeout para permitir que la UI se actualice antes del cálculo
    setTimeout(() => {
      const { distancia, ruta } = resolverTSPGenetico(NODOS);

      drawRoute(ruta);
      showResult({ ruta, distancia, esTSP: true });

      btnTsp.textContent = textoOriginal;
    }, 50);
  });
};