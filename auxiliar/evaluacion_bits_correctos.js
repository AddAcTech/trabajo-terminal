import { createCanvas, loadImage, ImageData } from "canvas";
import fs from "fs-extra";
import { glob } from "glob";
import path from "path";
import { encryptImage, decryptImage } from "./cifrado.js"; // tus funciones ya dadas

global.ImageData = ImageData; // requerido por las funciones de cifrado

// === CONFIGURACIÓN ===
const INPUT_DIR = "./test";
const OUTPUT_DIR = "./res_bit_ratio";
const CSV_PATH = path.join(OUTPUT_DIR, "resultados_iteraciones.csv");
const PASSWORD = "p455w0rd-PL4C3H0LD3R";
const blockSize = 16;
const QUALITY = 0.85;
const max_iterations = 10;

const BCR_THRESHOLDS = [0.8, 0.7, 0.6, 0.5]; // 80%, 50%, 30%

const useDynamicKey = true; //Para comprobar si el patrón se repite al cambiar la clave

await fs.ensureDir(OUTPUT_DIR);

// === FUNCIONES AUXILIARES ===
function generateKey() {
  // Aquí coloca tu generador de clave real
  return Math.floor(Math.random() * 1e9).toString(16);
}

// === Función auxiliar para cargar imágenes como ImageData ===
async function loadImageDataFromFile(filePath) {
  const img = await loadImage(filePath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

// === Guardar ImageData como JPEG ===
async function saveImageDataAsJPEG(imageData, outputPath, quality = QUALITY) {
  const canvas = createCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext("2d");
  ctx.putImageData(imageData, 0, 0);
  const buffer = canvas.toBuffer("image/jpeg", { quality });
  await fs.writeFile(outputPath, buffer);
}

// === Calcular Razón de Bits Correctos ===
function computeBitCorrectRatio(img1, img2) {
  if (img1.data.length !== img2.data.length) throw new Error("Tamaños distintos");
  let correctBits = 0;
  let totalBits = img1.data.length * 8;
  for (let i = 0; i < img1.data.length; i++) {
    const diff = img1.data[i] ^ img2.data[i];
    const diffBits = diff.toString(2).split("1").length - 1;
    correctBits += 8 - diffBits;
  }
  return correctBits / totalBits;
}

// === Escritura del CSV ===
async function writeCSV(records) {
  const headers = [
    "Imagen",
    "Umbral BCR",
    "Iteraciones",
    "BCR alcanzado"
  ];
  const csv = [headers.join(",")].concat(
    records.map(r => [r.image, r.blockSize, r.threshold, r.iterations, r.bcr.toFixed(4)].join(","))
  );
  await fs.writeFile(CSV_PATH, csv.join("\n"), "utf8");
  console.log(`✅ CSV guardado en: ${CSV_PATH}`);
}

// === PROCESO PRINCIPAL ===
async function main() {
  //const files = glob.sync(path.join(INPUT_DIR, "**/*.{jpeg,jpg,png,bmp,jfif}"));
  const pattern = path.join(INPUT_DIR, "**/*.{jpeg,jpg,png,bmp,jfif}").replace(/\\/g, "/");
  const files = glob.sync(pattern, { nocase: true });
  if (files.length === 0) {
    console.warn(`⚠️ No se encontraron imágenes en: ${INPUT_DIR}`);
    console.warn(`Patrón usado: ${pattern}`);
    console.warn("Asegúrate de que los archivos existan y tengan extensiones válidas (.jpg, .jpeg, .png, .bmp, .jfif).");
    process.exit(1);
  }
  console.log(`Se encontraron ${files.length} imágenes.`);
  const results = [];
  const iterationStats = Array(max_iterations).fill(0).map(() => []);

  for (const imgPath of files) {
    const imageName = path.basename(imgPath);
    console.log(`\n🖼 Procesando ${imageName}...`);
    const original = await loadImageDataFromFile(imgPath);

    let thresholdReached = {};

    console.log(`\n🔹 Tamaño de bloque: ${blockSize}`);
    let current = original;
    let iteration = 0;
    const reached = new Set();
    const baseKey = generateKey();
    for(iteration = 1; iteration <= max_iterations; iteration++) {
      console.log(` Iteración #${iteration}`);
      const key = useDynamicKey ? generateKey() : baseKey;
       // --- CIFRAR ---
      const enc = await encryptImage(current, blockSize, key);
      const encPath = path.join(OUTPUT_DIR, `${path.parse(imageName).name}_b${blockSize}_enc_iter${iteration}.jpg`);
      await saveImageDataAsJPEG(enc.image, encPath, QUALITY);

      // --- DESCIFRAR ---
      const encJPEG = await loadImageDataFromFile(encPath);
      const dec = await decryptImage(encJPEG, blockSize, key, enc.extraRows, enc.extraCols);
      const bcr = computeBitCorrectRatio(original, dec.image);

      console.log(`   Iteración ${iteration}: bitCorrectRatio = ${(bcr * 100).toFixed(4)}%`);
      iterationStats[iteration - 1].push(bcr);

      // --- Verificar si se cruza algún umbral ---
      for (const th of BCR_THRESHOLDS) {
        if (!reached.has(th) && bcr <= th) {
          reached.add(th);
          const decPath = path.join(OUTPUT_DIR, `${path.parse(imageName).name}_b${blockSize}_BCR${Math.round(th * 100)}.jpg`);
          await saveImageDataAsJPEG(dec.image, decPath, 1.0);
          results.push({
            image: imageName,
            threshold: th,
            iterations: iteration,
            bcr
          });
            console.log(`   🏁 Umbral ${th * 100}% alcanzado en iteración ${iteration}`);
          }
        }

        // --- Preparar siguiente iteración ---
        current = dec.image;

        //si es la ultima
        if (iteration >= max_iterations ){
          const decPath = path.join(OUTPUT_DIR, `${path.parse(imageName).name}_b${blockSize}_LIMITE.jpg`);
          await saveImageDataAsJPEG(dec.image, decPath, 1.0);
          results.push({
              image: imageName,
              threshold: 0,
              iterations: iteration,
              bcr
            });
        }

        // --- Limpiar imágenes que no alcanzaron umbral ---
        if (![...reached].includes(bcr)) {
          await fs.remove(encPath).catch(() => {});
        }
      }
    
  }

  await writeCSV(results);

  const avgLines = ["iteration,avg_bitCorrectRatio"];
  for (let i = 0; i < iterationStats.length; i++) {
    const vals = iterationStats[i];
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    avgLines.push(`${i + 1},${avg.toFixed(6)}`);
  }
  fs.writeFileSync("promedio_iteraciones.csv", avgLines.join("\n"), "utf8");

}

await main();
