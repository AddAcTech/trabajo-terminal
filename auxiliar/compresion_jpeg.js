/**
 * evaluacion_compresion.js
 * Evalúa la degradación acumulada por compresión JPEG repetida.
 * Guarda solo imágenes en las iteraciones de checkpoint.
 */

import fs from "fs";
import path from "path";
import {glob} from "glob";
import { createCanvas, loadImage } from "canvas";
import { createObjectCsvWriter } from "csv-writer";

// ======================
// ⚙️ Configuración inicial
// ======================

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Uso: node evaluacion_compresion.js <inputDir> <outputDir>");
  process.exit(1);
}

const [inputDir, outputDir] = args;
const iterations = 15;
const quality = 0.85;
const checkpoints = [1, 5, 10, 15]; // iteraciones que se guardan en disco

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// ======================
// 📸 Funciones auxiliares
// ======================

async function loadImageDataFromFile(filePath) {
  let img = await loadImage(filePath);
  let canvas = createCanvas(img.width, img.height);
  let ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const imageDataReturn = ctx.getImageData(0, 0, img.width, img.height);
  canvas.width = 0;
  canvas.height = 0;
  ctx = null;
  canvas = null;
  img = null;
  return imageDataReturn;
}

async function saveAsJPEG(imageData, filePath, quality) {
  let canvas = createCanvas(imageData.width, imageData.height);
  let ctx = canvas.getContext("2d");
  ctx.putImageData(imageData, 0, 0);
  const buffer = canvas.toBuffer("image/jpeg", { quality });
  fs.writeFileSync(filePath, buffer);
  canvas.width = 0;
  canvas.height = 0;
  ctx = null;
  canvas = null;
  return buffer.length;
}

function computeMSE(imgA, imgB) {
  let mse = 0;
  const len = imgA.data.length;
  for (let i = 0; i < len; i += 4) {
    for (let c = 0; c < 3; c++) {
      const diff = imgA.data[i + c] - imgB.data[i + c];
      mse += diff * diff;
    }
  }
  return mse / (imgA.width * imgA.height * 3);
}

function computePSNR(mse) {
  if (mse === 0) return 99;
  return 10 * Math.log10((255 * 255) / mse);
}

function computeCorrelationChannels(imgA, imgB) {
  const n = imgA.width * imgA.height;
  const meansA = [0, 0, 0];
  const meansB = [0, 0, 0];

  for (let i = 0; i < imgA.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      meansA[c] += imgA.data[i + c];
      meansB[c] += imgB.data[i + c];
    }
  }
  for (let c = 0; c < 3; c++) {
    meansA[c] /= n;
    meansB[c] /= n;
  }

  const num = [0, 0, 0];
  const denA = [0, 0, 0];
  const denB = [0, 0, 0];

  for (let i = 0; i < imgA.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const da = imgA.data[i + c] - meansA[c];
      const db = imgB.data[i + c] - meansB[c];
      num[c] += da * db;
      denA[c] += da * da;
      denB[c] += db * db;
    }
  }

  const corr = { r: 0, g: 0, b: 0 };
  for (let c = 0; c < 3; c++) {
    corr[["r", "g", "b"][c]] = num[c] / Math.sqrt(denA[c] * denB[c]);
  }
  return corr;
}

function countDifferentBits(a, b) {
  let diff = a ^ b;
  let count = 0;
  while (diff) {
    count += diff & 1;
    diff >>= 1;
  }
  return count;
}

function computeBitCorrectRatio(imgA, imgB) {
  let sameBits = 0;
  let totalBits = imgA.width * imgA.height * 3 * 8;
  for (let i = 0; i < imgA.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const a = imgA.data[i + c];
      const b = imgB.data[i + c];
      sameBits += 8 - countDifferentBits(a, b);
    }
  }
  return sameBits / totalBits;
}

// ======================
// 🚀 Ejecución principal
// ======================

const files = glob.sync(path.join(inputDir, "**/*.{jpg,jpeg,png,bmp,jfif,JPG,PNG,BMP,JPEG}").replace(/\\/g, "/"));

if (files.length === 0) {
  console.error("No se encontraron imágenes en la carpeta.");
  process.exit(1);
}
// Inicializar arreglo de métricas globales por iteración
const iterationStats = Array.from({ length: iterations }, () => ({
  mse: 0,
  psnr: 0,
  corrR: 0,
  corrG: 0,
  corrB: 0,
  bcr: 0
}));

const csvWriter = createObjectCsvWriter({
  path: path.join(outputDir, "evaluacion_compresion.csv"),
  header: [
    { id: "iteracion", title: "Iteración" },
    { id: "avgMSE", title: "Promedio MSE" },
    { id: "avgPSNR", title: "Promedio PSNR" },
    { id: "avgCorrR", title: "Promedio CorrR" },
    { id: "avgCorrG", title: "Promedio CorrG" },
    { id: "avgCorrB", title: "Promedio CorrB" },
    { id: "avgBCR", title: "Promedio BCR" }
  ]
});

// Procesar cada imagen
for (const filePath of files) {
  const base = path.basename(filePath);
  console.log(`\nProcesando ${base}...`);

  const orig = await loadImageDataFromFile(filePath);
  let current = orig;

  for (let i = 1; i <= iterations; i++) {
    const tempName = `${path.parse(base).name}_iter${i}.jpg`;
    const tempPath = path.join(outputDir, tempName);

    await saveAsJPEG(current, tempPath, quality);
    const compressed = await loadImageDataFromFile(tempPath);

    const mse = computeMSE(orig, compressed);
    const psnr = computePSNR(mse);
    const corr = computeCorrelationChannels(orig, compressed);
    const bcr = computeBitCorrectRatio(orig, compressed);

    // Sumar métricas a la iteración correspondiente
    iterationStats[i - 1].mse += mse;
    iterationStats[i - 1].psnr += psnr;
    iterationStats[i - 1].corrR += corr.r;
    iterationStats[i - 1].corrG += corr.g;
    iterationStats[i - 1].corrB += corr.b;
    iterationStats[i - 1].bcr += bcr;

    // Guardar solo checkpoints, borrar el resto
    if (!checkpoints.includes(i)) {
      try { fs.unlinkSync(tempPath); } catch {}
    }

    current = compressed;
  }
}

// Calcular promedios globales por iteración
const numImages = files.length;
const finalResults = iterationStats.map((st, idx) => ({
  iteracion: idx + 1,
  avgMSE: st.mse / numImages,
  avgPSNR: st.psnr / numImages,
  avgCorrR: st.corrR / numImages,
  avgCorrG: st.corrG / numImages,
  avgCorrB: st.corrB / numImages,
  avgBCR: st.bcr / numImages
}));

// Guardar CSV final
await csvWriter.writeRecords(finalResults);

console.log(`\n✅ Evaluación completada. Resultados guardados en:`);
console.log(`   ${path.join(outputDir, "evaluacion_compresion.csv")}`);