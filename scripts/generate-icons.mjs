#!/usr/bin/env node
/**
 * Genera la identidad visual de Mi Explotación (logo de oveja) en SVG y PNG.
 *
 * Fuente única: el dibujo de la oveja vive aquí y se compone en tres fondos:
 *   - icon.svg / icon-192.png / icon-512.png / favicon-32.png
 *       cuadrado redondeado verde con degradado (purpose "any").
 *   - icon-maskable.svg / icon-maskable-512.png
 *       fondo a sangre y oveja dentro de la zona segura (80 %) para Android.
 *   - apple-touch-icon.png (180×180)
 *       fondo opaco a sangre; iOS ya redondea las esquinas.
 *
 * Uso (desde la raíz del repo):
 *   node scripts/generate-icons.mjs
 *
 * Requiere `sharp` (devDependency). Escribe en public/icons/.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "icons");

// Verde campo de la marca: hsl(145 63% 28%) ≈ #1a7440.
const GREEN_TOP = "#2a8b52";
const GREEN_BOTTOM = "#145c33";
const WOOL = "#ffffff";
const WOOL_SHADE = "#e6efe8";
const FACE = "#10331f";
const LEGS = "#0d2a19";

/** Oveja dibujada en un lienzo de 512×512, centrada visualmente. */
const SHEEP = `
  <g>
    <!-- Sombra en el suelo -->
    <ellipse cx="262" cy="398" rx="130" ry="14" fill="#000" opacity="0.14"/>
    <!-- Patas -->
    <rect x="198" y="318" width="30" height="80" rx="15" fill="${LEGS}"/>
    <rect x="300" y="318" width="30" height="80" rx="15" fill="${LEGS}"/>
    <!-- Lana: nube de círculos -->
    <g fill="${WOOL}">
      <circle cx="196" cy="262" r="58"/>
      <circle cx="244" cy="206" r="62"/>
      <circle cx="312" cy="200" r="60"/>
      <circle cx="366" cy="248" r="56"/>
      <circle cx="350" cy="306" r="52"/>
      <circle cx="286" cy="322" r="54"/>
      <circle cx="222" cy="316" r="50"/>
      <ellipse cx="280" cy="262" rx="110" ry="80"/>
    </g>
    <!-- Volumen sutil en la parte baja de la lana -->
    <path d="M176 300 q40 52 110 52 q70 0 104 -46 q-10 46 -60 62 q-30 10 -60 4 q-30 8 -62 -6 q-30 -14 -32 -66z" fill="${WOOL_SHADE}"/>
    <!-- Cabeza -->
    <g transform="rotate(-14 150 250)">
      <ellipse cx="150" cy="262" rx="46" ry="60" fill="${FACE}"/>
      <!-- Oreja -->
      <ellipse cx="104" cy="226" rx="30" ry="14" transform="rotate(-24 104 226)" fill="${FACE}"/>
      <!-- Mechón de lana sobre la frente -->
      <circle cx="150" cy="208" r="30" fill="${WOOL}"/>
      <circle cx="176" cy="216" r="22" fill="${WOOL}"/>
      <!-- Ojo -->
      <circle cx="138" cy="256" r="7.5" fill="${WOOL}"/>
    </g>
  </g>`;

const gradient = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GREEN_TOP}"/>
      <stop offset="1" stop-color="${GREEN_BOTTOM}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.3" cy="0.18" r="0.8">
      <stop offset="0" stop-color="#fff" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

/** Icono estándar: cuadrado redondeado (squircle aproximado) con margen. */
function roundedSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${gradient}
  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#bg)"/>
  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#glow)"/>
  <g transform="translate(256 256) scale(0.95) translate(-250 -280)">${SHEEP}
  </g>
</svg>
`;
}

/**
 * Fondo a sangre (sin esquinas). `scale` controla el tamaño de la oveja:
 * maskable debe quedar dentro del círculo seguro (radio 40 %).
 */
function fullBleedSvg(scale) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${gradient}
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect width="512" height="512" fill="url(#glow)"/>
  <g transform="translate(256 256) scale(${scale}) translate(-250 -280)">${SHEEP}
  </g>
</svg>
`;
}

async function png(svg, size, file) {
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, file));
  console.log(`  ✓ ${file} (${size}×${size})`);
}

await mkdir(outDir, { recursive: true });

const icon = roundedSvg();
const maskable = fullBleedSvg(0.7);
const apple = fullBleedSvg(0.9);

await writeFile(path.join(outDir, "icon.svg"), icon);
await writeFile(path.join(outDir, "icon-maskable.svg"), maskable);
console.log("  ✓ icon.svg, icon-maskable.svg");

await png(icon, 192, "icon-192.png");
await png(icon, 512, "icon-512.png");
await png(icon, 32, "favicon-32.png");
await png(maskable, 512, "icon-maskable-512.png");
await png(apple, 180, "apple-touch-icon.png");

console.log("Iconos generados en public/icons/");
