// ============================================================
//  map.js  –  Integración Google Maps API
//  Maneja: mapa, marcadores, polylines, bounding box
// ============================================================
import { DEPARTAMENTOS } from "./data.js";

let map = null;
let markers = [];
let routePolyline = null;
let allPolylines = [];
let highlightPolyline = null;
let bounds = null;

const COLOR_RUTA    = "#F5A623"; // dorado – ruta óptima
const COLOR_ARISTA  = "#1E3A5F"; // azul oscuro – todas las aristas
const COLOR_ORIGEN  = "#2563EB"; // azul – nodo inicio
const COLOR_DESTINO = "#DC2626"; // rojo – nodo fin
const COLOR_PASO    = "#F5A623"; // dorado – nodos intermedios

/** Inicializa el mapa centrado en Perú */
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center:    { lat: -9.19, lng: -75.0 },
    zoom:      6,
    mapTypeId: "roadmap",
    styles: [
      { elementType: "geometry",        stylers: [{ color: "#1a2744" }] },
      { elementType: "labels.text.fill",stylers: [{ color: "#a8b8d8" }] },
      { elementType: "labels.text.stroke",stylers:[{ color: "#0d1b3e" }] },
      { featureType: "administrative.country", elementType: "geometry.stroke",
        stylers: [{ color: "#4a6fa5" }, { weight: 1.5 }] },
      { featureType: "administrative.province", elementType: "geometry.stroke",
        stylers: [{ color: "#2d4f7c" }, { weight: 1 }] },
      { featureType: "water", elementType: "geometry",
        stylers: [{ color: "#0d2137" }] },
      { featureType: "road", elementType: "geometry",
        stylers: [{ color: "#2d4f7c" }] },
      { featureType: "road", elementType: "geometry.stroke",
        stylers: [{ color: "#1a2e4a" }] },
      { featureType: "landscape", elementType: "geometry",
        stylers: [{ color: "#1a2744" }] },
    ],
  });
}

/** Dibuja todas las aristas del grafo como líneas tenues */
function drawAllEdges(conexiones) {
  clearEdges();
  conexiones.forEach(([u, v]) => {
    const a = DEPARTAMENTOS[u];
    const b = DEPARTAMENTOS[v];
    if (!a || !b) return;
    const line = new google.maps.Polyline({
      path: [
        { lat: a.lat, lng: a.lng },
        { lat: b.lat, lng: b.lng },
      ],
      strokeColor:   COLOR_ARISTA,
      strokeOpacity: 0.25,
      strokeWeight:  1,
      map,
    });
    allPolylines.push(line);
  });
}

/** Dibuja marcadores para todos los departamentos */
function drawAllMarkers(onMarkerClick) {
  clearMarkers();
  Object.entries(DEPARTAMENTOS).forEach(([id, dep]) => {
    const marker = new google.maps.Marker({
      position: { lat: dep.lat, lng: dep.lng },
      map,
      title: `${dep.capital} (${dep.nombre})`,
      icon: {
        path:         google.maps.SymbolPath.CIRCLE,
        scale:        6,
        fillColor:    "#a8b8d8",
        fillOpacity:  0.9,
        strokeColor:  "#1E3A5F",
        strokeWeight: 1.5,
      },
      depId: id,
    });

    // Info window
    const infoWin = new google.maps.InfoWindow({
      content: `<div style="font-family:sans-serif;font-size:13px;color:#1a2744">
                  <b>${dep.capital}</b><br>${dep.nombre}
                </div>`,
    });
    marker.addListener("click", () => {
      infoWin.open(map, marker);
      if (onMarkerClick) onMarkerClick(id);
    });

    markers.push({ id, marker, infoWin });
  });
}

/** Actualiza el color de un marcador */
function setMarkerStyle(depId, tipo) {
  const entry = markers.find(m => m.id === depId);
  if (!entry) return;
  const configs = {
    origen:   { color: COLOR_ORIGEN,  scale: 10 },
    destino:  { color: COLOR_DESTINO, scale: 10 },
    paso:     { color: COLOR_PASO,    scale:  8 },
    normal:   { color: "#a8b8d8",     scale:  6 },
  };
  const cfg = configs[tipo] || configs.normal;
  entry.marker.setIcon({
    path:         google.maps.SymbolPath.CIRCLE,
    scale:        cfg.scale,
    fillColor:    cfg.color,
    fillOpacity:  1,
    strokeColor:  "#ffffff",
    strokeWeight: 2,
  });
}

/** Resetea todos los marcadores a estilo normal */
function resetAllMarkers() {
  markers.forEach(({ id }) => setMarkerStyle(id, "normal"));
}

/**
 * Dibuja la ruta óptima siguiendo las carreteras reales usando OSRM
 * y enmarca el bounding box.
 * @param {string[]} ruta - Array de IDs de departamentos
 */
async function drawRoute(ruta) {
  clearRoute();

  // 1. Extraer coordenadas originales de los departamentos
  const path = ruta.map(id => ({
    lat: DEPARTAMENTOS[id].lat,
    lng: DEPARTAMENTOS[id].lng,
  }));

  // 2. Preparar el string de coordenadas para la API de OSRM
  // OSRM requiere el formato: longitud,latitud;longitud,latitud
  const coordsStr = ruta.map(id => {
    const dep = DEPARTAMENTOS[id];
    return `${dep.lng},${dep.lat}`;
  }).join(';');

  try {
    // 3. Consultar la API pública y gratuita de trazado de carreteras
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    let routeCoordinates = path; // Fallback: usamos línea recta por si la API falla

    // Si la API responde correctamente, extraemos los puntos de la carretera
    if (data.code === 'Ok' && data.routes.length > 0) {
      routeCoordinates = data.routes[0].geometry.coordinates.map(coord => ({
        lat: coord[1], 
        lng: coord[0]
      }));
    }

    // 4. Dibujar la Polyline con todas las curvas de la carretera
    routePolyline = new google.maps.Polyline({
      path: routeCoordinates,
      strokeColor:   COLOR_RUTA,
      strokeOpacity: 1,
      strokeWeight:  4,
      // Opcional: reducimos un poco la repetición de flechas porque ahora hay más curvas
      icons: [
        {
          icon:   { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3 },
          offset: "50%",
          repeat: "150px",
        },
      ],
      map,
    });

    // 5. Enmarcar el mapa (Bounding box) ajustado a las curvas
    bounds = new google.maps.LatLngBounds();
    routeCoordinates.forEach(p => bounds.extend(p));
    map.fitBounds(bounds, { padding: 80 });

    // Rectángulo visual alrededor de la ruta
    highlightPolyline = new google.maps.Rectangle({
      bounds,
      strokeColor:   "#2563EB",
      strokeOpacity: 0.9,
      strokeWeight:  3,
      fillColor:     "#2563EB",
      fillOpacity:   0.06,
      map,
    });

    // 6. Colorear nodos de la ruta
    resetAllMarkers();
    ruta.forEach((id, i) => {
      if      (i === 0)           setMarkerStyle(id, "origen");
      else if (i === ruta.length - 1) setMarkerStyle(id, "destino");
      else                        setMarkerStyle(id, "paso");
    });

  } catch (error) {
    console.error("Error al obtener la ruta de carreteras:", error);
  }
}

/** Limpia la ruta del mapa */
function clearRoute() {
  if (routePolyline)    { routePolyline.setMap(null);    routePolyline    = null; }
  if (highlightPolyline){ highlightPolyline.setMap(null); highlightPolyline = null; }
}

function clearEdges() {
  allPolylines.forEach(p => p.setMap(null));
  allPolylines = [];
}

function clearMarkers() {
  markers.forEach(({ marker }) => marker.setMap(null));
  markers = [];
}

export {
  initMap, drawAllEdges, drawAllMarkers,
  drawRoute, clearRoute, resetAllMarkers, setMarkerStyle,
};