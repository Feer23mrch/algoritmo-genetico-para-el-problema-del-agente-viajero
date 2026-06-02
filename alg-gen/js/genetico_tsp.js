// ============================================================
//  genetico_tsp.js – Algoritmo Genético para TSP (Agente Viajero)
// ============================================================
import { DEPARTAMENTOS } from "./data.js";

// 1. Calcular distancia Haversine (en KM en línea recta)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 2. Caché de distancias para optimizar velocidad
const distMatrix = {};
function getDist(n1, n2) {
    if (n1 === n2) return 0;
    const key = n1 < n2 ? `${n1}-${n2}` : `${n2}-${n1}`;
    if (!distMatrix[key]) {
        distMatrix[key] = calcularDistancia(
            DEPARTAMENTOS[n1].lat, DEPARTAMENTOS[n1].lng,
            DEPARTAMENTOS[n2].lat, DEPARTAMENTOS[n2].lng
        );
    }
    return distMatrix[key];
}

// 3. Evaluar distancia total de un cromosoma (ruta)
function evaluarRuta(ruta) {
    let d = 0;
    for (let i = 0; i < ruta.length - 1; i++) {
        d += getDist(ruta[i], ruta[i + 1]);
    }
    // Cerrar el ciclo (volver al inicio)
    d += getDist(ruta[ruta.length - 1], ruta[0]);
    return d;
}

// 4. Operadores Genéticos
function crearIndividuo(nodos) {
    const ruta = [...nodos];
    for (let i = ruta.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ruta[i], ruta[j]] = [ruta[j], ruta[i]];
    }
    return ruta;
}

// Cruzamiento de Orden (OX)
function crossover(padre1, padre2) {
    const start = Math.floor(Math.random() * padre1.length);
    const end = Math.floor(Math.random() * (padre1.length - start)) + start;

    const hijo = new Array(padre1.length).fill(null);
    const subRuta = padre1.slice(start, end);

    for (let i = start; i < end; i++) {
        hijo[i] = padre1[i];
    }

    let p2Index = 0;
    for (let i = 0; i < hijo.length; i++) {
        if (hijo[i] === null) {
            while (subRuta.includes(padre2[p2Index])) {
                p2Index++;
            }
            hijo[i] = padre2[p2Index];
            p2Index++;
        }
    }
    return hijo;
}

function mutate(ruta, tasaMutacion) {
    if (Math.random() < tasaMutacion) {
        const i = Math.floor(Math.random() * ruta.length);
        const j = Math.floor(Math.random() * ruta.length);
        [ruta[i], ruta[j]] = [ruta[j], ruta[i]]; // Swap
    }
}

// 5. Bucle Principal del Algoritmo
export function resolverTSPGenetico(nodos) {
    const POP_SIZE = 100;
    const GENERATIONS = 500;
    const MUTATION_RATE = 0.1;

    let poblacion = Array.from({ length: POP_SIZE }, () => crearIndividuo(nodos));
    let mejorRutaGlobal = null;
    let mejorDistanciaGlobal = Infinity;

    for (let gen = 0; gen < GENERATIONS; gen++) {
        // Evaluar fitness (buscamos la menor distancia)
        poblacion.sort((a, b) => evaluarRuta(a) - evaluarRuta(b));

        const mejorActual = poblacion[0];
        const distActual = evaluarRuta(mejorActual);

        if (distActual < mejorDistanciaGlobal) {
            mejorDistanciaGlobal = distActual;
            mejorRutaGlobal = [...mejorActual];
        }

        const nuevaPoblacion = [mejorRutaGlobal]; // Elitismo

        while (nuevaPoblacion.length < POP_SIZE) {
            // Selección por torneo simple (tomamos los mejores de la mitad superior)
            const p1 = poblacion[Math.floor(Math.random() * (POP_SIZE / 2))];
            const p2 = poblacion[Math.floor(Math.random() * (POP_SIZE / 2))];

            const hijo = crossover(p1, p2);
            mutate(hijo, MUTATION_RATE);
            nuevaPoblacion.push(hijo);
        }
        poblacion = nuevaPoblacion;
    }

    // Retornamos la ruta con el ciclo cerrado para dibujarla
    return {
        distancia: Math.round(mejorDistanciaGlobal),
        ruta: [...mejorRutaGlobal, mejorRutaGlobal[0]]
    };
}