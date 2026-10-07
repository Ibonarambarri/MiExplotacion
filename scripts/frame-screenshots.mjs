/**
 * Mete capturas de móvil dentro de un marco de iPhone para el README.
 *
 *   node scripts/frame-screenshots.mjs
 *
 * Entrada: docs/screenshots/raw/<nombre>.png — capturas a 393×764 pt (3x), es
 * decir, la pantalla del iPhone 15 Pro sin barra de estado (54 pt) ni zona del
 * indicador de inicio (34 pt). Los archivos que terminan en "-dark" usan
 * iconos de barra de estado claros.
 *
 * Salida: docs/screenshots/<nombre>.png (teléfono con fondo transparente) y
 * docs/screenshots/hero.png (composición de varias pantallas).
 */
import { readdirSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const RAW = join(ROOT, "docs", "screenshots", "raw");
const OUT = join(ROOT, "docs", "screenshots");

const S = 3; // escala (px por punto)
const SCREEN_W = 393 * S;
const SCREEN_H = 852 * S;
const STATUS_H = 54 * S;
const HOME_H = 34 * S;
const BEZEL = 16 * S;
const SCREEN_R = 55 * S;
const PHONE_W = SCREEN_W + BEZEL * 2;
const PHONE_H = SCREEN_H + BEZEL * 2;
const PHONE_R = SCREEN_R + BEZEL;
const PAD = 12 * S; // margen para botones laterales y sombra

function statusBarSvg(dark) {
  const fg = dark ? "#ffffff" : "#000000";
  const y = 33 * S;
  return `
    <text x="${60 * S}" y="${y}" font-family="-apple-system, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif"
      font-size="${17 * S}" font-weight="600" fill="${fg}" text-anchor="middle">9:41</text>
    <g transform="translate(${SCREEN_W - 104 * S}, ${y - 11 * S})" fill="${fg}">
      <rect x="0" y="${7 * S}" width="${3 * S}" height="${4 * S}" rx="${0.8 * S}"/>
      <rect x="${4.5 * S}" y="${5 * S}" width="${3 * S}" height="${6 * S}" rx="${0.8 * S}"/>
      <rect x="${9 * S}" y="${2.5 * S}" width="${3 * S}" height="${8.5 * S}" rx="${0.8 * S}"/>
      <rect x="${13.5 * S}" y="0" width="${3 * S}" height="${11 * S}" rx="${0.8 * S}"/>
      <g transform="translate(${23 * S}, 0)">
        <path d="M${8 * S} ${11 * S} l${-2.6 * S} ${-2.8 * S} a${3.8 * S} ${3.8 * S} 0 0 1 ${5.2 * S} 0 z"/>
        <path d="M${1.6 * S} ${4.6 * S} a${9 * S} ${9 * S} 0 0 1 ${12.8 * S} 0" stroke="${fg}" stroke-width="${1.7 * S}" fill="none" stroke-linecap="round"/>
        <path d="M${3.9 * S} ${7 * S} a${5.8 * S} ${5.8 * S} 0 0 1 ${8.2 * S} 0" stroke="${fg}" stroke-width="${1.7 * S}" fill="none" stroke-linecap="round"/>
      </g>
      <g transform="translate(${46 * S}, ${-0.5 * S})">
        <rect x="0" y="0" width="${25 * S}" height="${12 * S}" rx="${3.6 * S}" fill="none" stroke="${fg}" stroke-opacity="0.4" stroke-width="${1 * S}"/>
        <rect x="${2 * S}" y="${2 * S}" width="${18 * S}" height="${8 * S}" rx="${2 * S}"/>
        <rect x="${26.3 * S}" y="${4 * S}" width="${1.4 * S}" height="${4 * S}" rx="${0.7 * S}" fill-opacity="0.4"/>
      </g>
    </g>`;
}

async function edgeColor(buf, fromBottom) {
  const img = sharp(buf);
  const { width, height } = await img.metadata();
  const strip = await sharp(buf)
    .extract({ left: 0, top: fromBottom ? height - 2 : 0, width, height: 2 })
    .resize(1, 1)
    .raw()
    .toBuffer();
  return `rgb(${strip[0]},${strip[1]},${strip[2]})`;
}

async function framePhone(file) {
  const name = basename(file, ".png");
  const dark = name.endsWith("-dark");
  const shot = await sharp(join(RAW, file))
    .resize(SCREEN_W, SCREEN_H - STATUS_H - HOME_H, { fit: "cover", position: "top" })
    .png()
    .toBuffer();
  const topColor = await edgeColor(shot, false);
  const bottomColor = await edgeColor(shot, true);
  const homeColor = dark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)";

  // Pantalla completa: barra de estado + captura + zona del indicador.
  const screenSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${SCREEN_W}" height="${SCREEN_H}">
      <rect width="100%" height="${STATUS_H}" fill="${topColor}"/>
      <rect y="${SCREEN_H - HOME_H}" width="100%" height="${HOME_H}" fill="${bottomColor}"/>
      ${statusBarSvg(dark)}
      <rect x="${(SCREEN_W - 126 * S) / 2}" y="${11 * S}" width="${126 * S}" height="${37 * S}" rx="${18.5 * S}" fill="#000"/>
      <rect x="${(SCREEN_W - 139 * S) / 2}" y="${SCREEN_H - 13 * S}" width="${139 * S}" height="${5 * S}" rx="${2.5 * S}" fill="${homeColor}"/>
    </svg>`;
  const screen = await sharp(Buffer.from(screenSvg))
    .composite([{ input: shot, top: STATUS_H, left: 0 }])
    .png()
    .toBuffer();
  // Dynamic Island y barra por encima de la captura.
  const overlay = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${SCREEN_W}" height="${SCREEN_H}">
      <rect x="${(SCREEN_W - 126 * S) / 2}" y="${11 * S}" width="${126 * S}" height="${37 * S}" rx="${18.5 * S}" fill="#000"/>
    </svg>`);
  const mask = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${SCREEN_W}" height="${SCREEN_H}">
      <rect width="${SCREEN_W}" height="${SCREEN_H}" rx="${SCREEN_R}" fill="#fff"/>
    </svg>`);
  const roundedScreen = await sharp(screen)
    .composite([{ input: overlay }, { input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const W = PHONE_W + PAD * 2;
  const H = PHONE_H + PAD * 2;
  const body = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs>
        <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#6b6e72"/>
          <stop offset="0.5" stop-color="#2b2d30"/>
          <stop offset="1" stop-color="#5a5d61"/>
        </linearGradient>
      </defs>
      <!-- botones laterales -->
      <rect x="${PAD - 3 * S}" y="${PAD + 180 * S}" width="${4 * S}" height="${32 * S}" rx="${1.5 * S}" fill="#3a3c3f"/>
      <rect x="${PAD - 3 * S}" y="${PAD + 235 * S}" width="${4 * S}" height="${62 * S}" rx="${1.5 * S}" fill="#3a3c3f"/>
      <rect x="${PAD - 3 * S}" y="${PAD + 310 * S}" width="${4 * S}" height="${62 * S}" rx="${1.5 * S}" fill="#3a3c3f"/>
      <rect x="${PAD + PHONE_W - 1 * S}" y="${PAD + 260 * S}" width="${4 * S}" height="${100 * S}" rx="${1.5 * S}" fill="#3a3c3f"/>
      <!-- cuerpo -->
      <rect x="${PAD}" y="${PAD}" width="${PHONE_W}" height="${PHONE_H}" rx="${PHONE_R}" fill="url(#rim)"/>
      <rect x="${PAD + 3 * S}" y="${PAD + 3 * S}" width="${PHONE_W - 6 * S}" height="${PHONE_H - 6 * S}" rx="${PHONE_R - 3 * S}" fill="#0a0a0b"/>
    </svg>`;
  const phone = await sharp(Buffer.from(body))
    .composite([{ input: roundedScreen, top: PAD + BEZEL, left: PAD + BEZEL }])
    .png()
    .toBuffer();

  const out = join(OUT, `${name}.png`);
  // Versión para el README: 1/2 de resolución, suficiente y ligera.
  await sharp(phone)
    .resize(Math.round(W / 2))
    .png({ compressionLevel: 9, palette: false })
    .toFile(out);
  console.log("✓", out);
  return { name, phone, W, H };
}

async function hero(phones, names, file, bg) {
  const picked = names.map((n) => phones.find((p) => p.name === n)).filter(Boolean);
  if (picked.length === 0) return;
  const scale = 0.5;
  const pw = Math.round(picked[0].W * scale);
  const ph = Math.round(picked[0].H * scale);
  const gap = Math.round(pw * 0.08);
  const W = picked.length * pw + (picked.length - 1) * gap + pw * 0.5;
  const H = Math.round(ph * 1.22);
  const layers = [];
  for (let i = 0; i < picked.length; i++) {
    const mid = (picked.length - 1) / 2;
    const offset = Math.round(Math.abs(i - mid) * ph * 0.05);
    const resized = await sharp(picked[i].phone).resize(pw, ph).png().toBuffer();
    layers.push({
      input: resized,
      left: Math.round(pw * 0.25 + i * (pw + gap)),
      top: Math.round((H - ph) / 2 + offset),
    });
  }
  const bgSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(W)}" height="${H}">
      <defs>
        <radialGradient id="g" cx="50%" cy="40%" r="75%">
          <stop offset="0" stop-color="${bg[0]}"/>
          <stop offset="1" stop-color="${bg[1]}"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" rx="${Math.round(pw * 0.08)}" fill="url(#g)"/>
    </svg>`;
  const out = join(OUT, file);
  await sharp(Buffer.from(bgSvg))
    .composite(layers)
    .resize(Math.min(2400, Math.round(W)))
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("✓", out);
}

mkdirSync(OUT, { recursive: true });
const files = readdirSync(RAW).filter((f) => f.endsWith(".png")).sort();
const phones = [];
for (const f of files) phones.push(await framePhone(f));

await hero(phones, ["ovejas", "inicio", "ficha"], "hero.png", ["#e9f3e6", "#cfe3c8"]);
await hero(phones, ["finanzas-dark", "inicio-dark", "calendario-dark"], "hero-dark.png", ["#1d2a22", "#0b120e"]);
