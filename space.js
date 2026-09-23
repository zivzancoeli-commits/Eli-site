// --- setup: canvas behind the page ---
const canvas = document.createElement("canvas");
canvas.id = "space";
document.body.prepend(canvas);

Object.assign(canvas.style, {
  position: "fixed",
  top: "0",
  left: "0",
  width: "100%",
  height: "100%",
  zIndex: "-1",
  pointerEvents: "none",
});

const ctx = canvas.getContext("2d");

// --- knobs you can change ---
const AU_KM = 149_597_870.7;
const MAX_AU = 1.5; // zoom: inner planets on screen; farther ones fall off edges
const SUN_RADIUS = 55;

const PLANET_COLORS = {
  mercury: "#b1b1b1",
  venus: "#e3c78a",
  earth: "dodgerblue",
  mars: "#c1440e",
  jupiter: "#d9a066",
  saturn: "#e6d5a8",
  uranus: "#7fdbff",
  neptune: "#4169e1",
};

const PLANET_SIZES = {
  mercury: 8,
  venus: 14,
  earth: 15,
  mars: 10,
  jupiter: 22,
  saturn: 18,
  uranus: 14,
  neptune: 14,
};

const PLANET_NAMES = [
  "mercury",
  "venus",
  "earth",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
];

// --- images (sprites) ---
const sunImage = new Image();
sunImage.src = "sprites/sun.png";
sunImage.onload = () => drawScene();

const planetImages = {};
for (const name of PLANET_NAMES) {
  const img = new Image();
  img.src = `sprites/${name}.png`;
  img.onload = () => drawScene();
  planetImages[name] = img;
}

// --- state ---
let planetPositions = {}; // name → { x, y }

// --- helpers ---
function sizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function kmToCanvas(xKm, yKm) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const scale =
    (Math.min(canvas.width, canvas.height) * 0.45) / (MAX_AU * AU_KM);

  return {
    x: cx + xKm * scale,
    y: cy - yKm * scale,
  };
}

function imageReady(img) {
  return img && img.complete && img.naturalWidth > 0;
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sx = canvas.width / 2;
  const sy = canvas.height / 2;

  // Sun
  if (imageReady(sunImage)) {
    const s = SUN_RADIUS * 2;
    ctx.drawImage(sunImage, sx - s / 2, sy - s / 2, s, s);
  } else {
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(sx, sy, SUN_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  // Planets
  for (const name of Object.keys(planetPositions)) {
    const pos = planetPositions[name];
    const r = PLANET_SIZES[name] || 8;
    const img = planetImages[name];

    if (imageReady(img)) {
      const s = r * 2;
      ctx.drawImage(img, pos.x - s / 2, pos.y - s / 2, s, s);
    } else {
      ctx.fillStyle = PLANET_COLORS[name] || "white";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

async function loadAndDraw() {
  sizeCanvas();
  drawScene();

  try {
    const res = await fetch("planets.json");
    if (!res.ok) {
      throw new Error("Missing planets.json");
    }

    const data = await res.json();
    planetPositions = {};

    for (const name of Object.keys(data)) {
      const { xKm, yKm } = data[name];
      planetPositions[name] = kmToCanvas(xKm, yKm);
    }

    drawScene();
    console.log("Planets loaded:", Object.keys(planetPositions));
  } catch (err) {
    console.error("Planet load failed:", err);
  }
}

// --- start ---
loadAndDraw();
window.addEventListener("resize", loadAndDraw);