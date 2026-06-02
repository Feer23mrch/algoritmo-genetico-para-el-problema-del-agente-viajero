# 🗺 Dijkstra Perú — Ruta más corta entre capitales

Aplicación web que implementa el **Algoritmo de Dijkstra** para encontrar
la ruta más corta entre las 25 capitales departamentales del Perú,
visualizado sobre Google Maps con estilo elegante.

---

## 📁 Estructura del proyecto

```
dijkstra-peru/
├── index.html          ← UI principal (Tailwind + glassmorphism)
├── js/
│   ├── data.js         ← Nodos (25 departamentos) + aristas (distancias KM)
│   ├── dijkstra.js     ← Algoritmo Dijkstra con Min-Heap
│   ├── map.js          ← Google Maps API: marcadores, rutas, bounding box
│   └── app.js          ← Controlador principal (conecta UI ↔ lógica)
└── README.md
```

---

## 🚀 Cómo ejecutar en VS Code

### Opción 1 — Live Server (recomendado)
1. Instala la extensión **Live Server** en VS Code.
2. Clic derecho en `index.html` → **"Open with Live Server"**.
3. Se abre en `http://127.0.0.1:5500`.

### Opción 2 — Python HTTP Server
```bash
cd dijkstra-peru
python -m http.server 5500
# Abre http://localhost:5500
```

> ⚠️ Los módulos ES6 (`import/export`) requieren un servidor HTTP.
> **No abras `index.html` directamente** en el navegador (`file://`).

---

## 🔑 Clave de Google Maps

En `index.html`, al final del archivo, reemplaza la key si es necesario:

```html
<script
  src="https://maps.googleapis.com/maps/api/js?key=TU_CLAVE_AQUI&callback=initApp&v=weekly"
  async defer>
</script>
```

La **Maps Demo Key** (`AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg`) funciona
en `localhost` para pruebas. Para producción, genera tu propia clave en
[Google Cloud Console](https://console.cloud.google.com/).

---

## 🧠 Cómo funciona Dijkstra aquí

1. **Grafo**: Los 25 departamentos son nodos; las carreteras principales
   son aristas con peso = distancia en KM.
2. **Min-Heap**: La cola de prioridad garantiza extraer siempre el nodo
   con menor distancia acumulada → O((V + E) log V).
3. **Resultado**: Se reconstruye la ruta desde el destino hacia el origen
   siguiendo el mapa de predecesores `prev[]`.

---

## 🎨 Características visuales

- 🌊 Glassmorphism navbar + cards
- 🔵 Bounding box azul alrededor de la ruta encontrada (como en la imagen de referencia)
- 🟡 Ruta óptima en color dorado con flechas animadas
- 🌑 Mapa oscuro personalizado estilo Andino
- 📊 Panel de resultados con distancias parciales por tramo

---

## 📦 Dependencias (CDN, sin instalación)

| Librería | Uso |
|----------|-----|
| Tailwind CSS | Estilos utilitarios |
| Google Fonts (Cinzel + Inter) | Tipografía |
| Google Maps JS API | Mapa interactivo |