/**
 * evaluacion_formatos.js
 * Evalúa el espacio de almacenamiento requerido por distintos formatos
 * (BMP, PNG, JPEG, GIF, JFIF) a partir de imágenes PNG descifradas.
 * Calcula grado de compresión y espacio ahorrado respecto al BMP.
 *
 * Uso:
 *   node evaluacion_formatos.js <inputDir> <outputDir>
 */

import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { createObjectCsvWriter } from "csv-writer";
import {glob} from "glob";
// ======================
// ⚙️ Configuración
// ======================
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Uso: node evaluacion_formatos.js <inputDir> <outputDir>");
  process.exit(1);
}

const [inputDir, outputDir] = args;
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// ======================
// 📸 Funciones auxiliares
// ======================

async function loadImageData(filePath) {
  const img = await loadImage(filePath);
  let canvas = createCanvas(img.width, img.height);
  let ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height);
  img.src = "";
  ctx = null;
  canvas = null;
  return data;
}

async function getEncodedSize(imageData, format, quality = 0.85) {
  const canvas = createCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext("2d");
  ctx.putImageData(imageData, 0, 0);

  switch (format.toLowerCase()) {
    case "jpeg":
    case "jfif": {
      const buffer = canvas.toBuffer("image/jpeg", { quality });
      return buffer.length;
    }

    // Simulación de GIF: cuantización simple a 256 colores (≈ 8 bits por píxel)
    case "gif": {
      const totalPixels = imageData.width * imageData.height;
      const simulatedBytes = totalPixels; // 1 byte por píxel (8 bits)
      return simulatedBytes;
    }

    default:
      throw new Error(`Formato no soportado: ${format}`);
  }
}



// ======================
// 🚀 Ejecución principal
// ======================

const pngFiles = glob.sync(path.join(inputDir, "**/*.png").replace(/\\/g, "/"));
if (pngFiles.length === 0) {
  console.error("No se encontraron imágenes PNG en la carpeta.");
  process.exit(1);
}

const csvWriter = createObjectCsvWriter({
  path: path.join(outputDir, "evaluacion_formatos.csv"),
  header: [
    { id: "imagen", title: "imagen" },
    { id: "formato", title: "formato" },
    { id: "espacioBytes", title: "espacioBytes" },
    { id: "compresionPerdida", title: "compresionPerdida" },
    { id: "gradoCompresion", title: "gradoCompresion" },
    { id: "espacioAhorrado", title: "espacioAhorrado" }
  ]
});

const results = [];

for (const filePath of pngFiles) {
  const baseName = path.basename(filePath);
  console.log(`\nProcesando ${baseName}...`);

  const imgData = await loadImageData(filePath);

  // BMP simulado (sin compresión, 3 canales RGB)
  const bmpSize = imgData.width * imgData.height * 3;

  // 1️⃣ BMP - referencia base
  results.push({
    imagen: baseName,
    formato: "bmp",
    espacioBytes: bmpSize,
    compresionPerdida: "No",
    gradoCompresion: 1.0,
    espacioAhorrado: 0.0
  });

  // 2️⃣ PNG
  const pngSize = fs.statSync(filePath).size;
  results.push({
    imagen: baseName,
    formato: "png",
    espacioBytes: pngSize,
    compresionPerdida: "No",
    gradoCompresion: pngSize / bmpSize,
    espacioAhorrado: 1 - (pngSize / bmpSize)
  });

  // 3️⃣ JPEG
  const jpegSize = await getEncodedSize(imgData, "jpeg", 0.85);
  results.push({
    imagen: baseName,
    formato: "jpeg",
    espacioBytes: jpegSize,
    compresionPerdida: "Sí",
    gradoCompresion: jpegSize / bmpSize,
    espacioAhorrado: 1 - (jpegSize / bmpSize)
  });

  // 4️⃣ GIF
  
  const gifSize = await getEncodedSize(imgData, "gif");
  results.push({
    imagen: baseName,
    formato: "gif",
    espacioBytes: gifSize,
    compresionPerdida: "Sí",
    gradoCompresion: gifSize / bmpSize,
    espacioAhorrado: 1 - (gifSize / bmpSize)
  });


  // Limpieza de memoria
  imgData.data = null;
  if (global.gc) global.gc();
}

// ======================
// 💾 Guardar resultados
// ======================

await csvWriter.writeRecords(results);

console.log(`\n✅ Evaluación completada.`);
console.log(`📄 Resultados guardados en: ${path.join(outputDir, "evaluacion_formatos.csv")}`);
