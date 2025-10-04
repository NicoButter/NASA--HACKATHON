// === 1. tsparticles: estrellas ===
tsParticles.load("tsparticles", {
  fullScreen: { enable: true, zIndex: 1 },
  particles: {
    number: { value: 150 },
    size: { value: { min: 1, max: 3 } },
    move: { enable: true, speed: 0.5, direction: "none", random: true, outModes: "out" },
    opacity: {
      value: { min: 0.2, max: 1 },
      animation: { enable: true, speed: 1, minimumValue: 0.2, sync: false }
    },
    color: { value: "#ffffff" }
  }
});

// === 2. INTRO → CONTENIDO ===
const startBtn = document.getElementById('start-btn');
const intro = document.getElementById('intro-screen');
const main = document.getElementById('main-content');

function showMain() {
  intro.style.opacity = '0';
  setTimeout(() => {
    intro.style.visibility = 'hidden';
    main.classList.add('visible');
  }, 1000);
}

startBtn.addEventListener('click', showMain);
setTimeout(showMain, 6000);

// === 3. NBL: astronauta flotando y burbujas ===
const pool = document.getElementById('pool');
const slider = document.getElementById('buoy-slider');
const buoyValue = document.getElementById('buoy-value');

let bubbleInterval = null;

// Mensajes según flotabilidad
const messages = {
  low: ["¡Estoy en microgravedad!", "Floto suavemente...", "Todo es ligero y etéreo."],
  neutral: ["Flotabilidad neutra: perfecto para entrenar.", "Trabajo como en el espacio real.", "Equilibrio completo."],
  high: ["Me estoy hundiendo...", "Siento el peso del traje.", "Debo esforzarme más."]
};

// --- Crear astronauta dinámicamente ---
const astronaut = document.createElement('div');
astronaut.className = 'astronaut-wrapper';
astronaut.innerHTML = '<i class="bi bi-person-bounding-box"></i>'; // icono de Bootstrap
pool.appendChild(astronaut);

// Crear burbuja de mensaje
function createBubble(msg) {
  const bubble = document.createElement('div');
  bubble.className = 'text-bubble';
  bubble.textContent = msg;
  bubble.style.left = `${10 + Math.random() * 70}%`;
  bubble.style.bottom = '0px';
  pool.appendChild(bubble);

  setTimeout(() => {
    bubble.style.bottom = `${pool.clientHeight - 60}px`;
    bubble.style.opacity = 1;
  }, 50);

  setTimeout(() => bubble.remove(), 3500);
}

// Actualizar posición astronauta, color y burbujas
function updateAstronaut() {
  const val = slider.value; // 0 a 100
  const poolHeight = pool.clientHeight;
  const astronautHeight = astronaut.clientHeight;

  // posición vertical (bottom)
  astronaut.style.bottom = `${(poolHeight - astronautHeight) * (val / 100)}px`;

  // color agua según profundidad
  const blueVal = 60 + Math.floor(195 * (1 - val / 100));
  pool.style.background = `linear-gradient(to bottom,rgb(12,36,64), rgb(10,31,58), rgb(0,0,${blueVal}))`;

  buoyValue.textContent = val + '%';

  // disparar burbujas y mensajes
  clearInterval(bubbleInterval);
  bubbleInterval = setInterval(() => {
    let msg = "";
    if (val <= 30) msg = messages.low[Math.floor(Math.random() * messages.low.length)];
    else if (val <= 70) msg = messages.neutral[Math.floor(Math.random() * messages.neutral.length)];
    else msg = messages.high[Math.floor(Math.random() * messages.high.length)];
    createBubble(msg);
  }, 2000);
}

// inicializamos
updateAstronaut();
slider.addEventListener('input', updateAstronaut);

// =============== 4. POSICIÓN EN VIVO DE LA ISS (Leaflet con estela) ===============

// Inicializar mapa centrado en [0,0]
const map = L.map('map').setView([0, 0], 2);

// Capa base (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 5,
  attribution: '© OpenStreetMap'
}).addTo(map);

const dataDiv = document.getElementById('iss-data');

// Icono ISS
const issIcon = L.icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Marker de la ISS
const issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);

// Polilínea para la estela
let trailCoords = [];
const trailLine = L.polyline(trailCoords, { color: "yellow", weight: 2 }).addTo(map);

async function fetchISS() {
  try {
    const res = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
    const data = await res.json();

    const latitude = data.latitude;
    const longitude = data.longitude;
    const altitude = data.altitude;
    const velocity = data.velocity;

    // Mover marcador
    issMarker.setLatLng([latitude, longitude]);

    // Guardar coords en la estela
    trailCoords.push([latitude, longitude]);
    if (trailCoords.length > 50) { // solo últimos 50 puntos
      trailCoords.shift();
    }
    trailLine.setLatLngs(trailCoords);

    // Centrar mapa en la ISS (opcional)
    map.setView([latitude, longitude], map.getZoom());

    // Datos
    dataDiv.innerHTML = `
      <h3 style="color:white;">ISS en tiempo real:</h3>
      <p style="color:white; margin:0;">
        📍 ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°<br>
        📏 Altitud: ${altitude.toFixed(1)} km<br>
        🚀 Velocidad: ${(velocity / 1000).toFixed(1)} km/s
      </p>
    `;
  } catch (err) {
    console.error("Error API ISS:", err);
    dataDiv.textContent = "No se pudo obtener la posición de la ISS.";
  }
}

// Actualizar cada 2 segundos
setInterval(fetchISS, 2000);
fetchISS();
