import { createCanvas, loadImage, ImageData } from "canvas";
import fs from "fs-extra";
import { glob } from "glob";
import path from "path";
import { encryptImage, decryptImage } from "./cifrado.js"; // tus funciones ya dadas

global.ImageData = ImageData; // requerido por las funciones de cifrado

console.log("process.argv =", process.argv);
// === CONFIGURACIÓN ===
const INPUT_DIR = "./entrada";
const OUTPUT_DIR = "./res_bit_ratio";
const modeArg = process.argv[2]?parseInt(process.argv[2]): 1;
const useDynamicKey = (modeArg == 1);
console.log(`🔐 Modo de clave seleccionado: ${useDynamicKey ? "DINÁMICA (nueva por iteración)" : "ESTÁTICA (misma clave)"}`);
const modeSuffix = useDynamicKey ? "_dynamic" : "_static";
const CSV_PATH = path.join(OUTPUT_DIR,`resultados_umbral${modeSuffix}.csv`);
const PASSWORD = "p455w0rd-PL4C3H0LD3R";
const blockSize = 16;
const QUALITY = 0.85;
const max_iterations = 15;

const BCR_THRESHOLDS = [0.8, 0.7, 0.6, 0.5]; // 80%, 50%, 30%


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
    "BCR alcanzado",
    "MSE",
    "PSNR",
    "Corr_R",
    "Corr_G",
    "Corr_B"
  ];
  const csv = [headers.join(",")].concat(
    records.map(r =>
      [
        r.image,
        r.threshold,
        r.iterations,
        r.bcr.toFixed(4),
        r.mse?.toFixed(4) ?? "",
        r.psnr?.toFixed(4) ?? "",
        r.corrR?.toFixed(4) ?? "",
        r.corrG?.toFixed(4) ?? "",
        r.corrB?.toFixed(4) ?? ""
      ].join(",")
    )
  );
  await fs.writeFile(CSV_PATH, csv.join("\n"), "utf8");
  console.log(`✅ CSV guardado en: ${CSV_PATH}`);
}

// === Métricas adicionales ===
function computeMSE(img1, img2) {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < img1.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const diff = img1.data[i + c] - img2.data[i + c];
      sum += diff * diff;
      count++;
    }
  }
  return sum / count;
}

function computePSNR(mse, maxVal = 255) {
  return mse === 0 ? 99.0 : 10 * Math.log10((maxVal * maxVal) / mse);
}

function pearsonPerChannel(img1, img2) {
  const result = {};
  const ch = ["r", "g", "b"];
  for (let c = 0; c < 3; c++) {
    const v1 = [], v2 = [];
    for (let i = c; i < img1.data.length; i += 4) {
      v1.push(img1.data[i]);
      v2.push(img2.data[i]);
    }
    const mean1 = v1.reduce((a,b)=>a+b)/v1.length;
    const mean2 = v2.reduce((a,b)=>a+b)/v2.length;
    let num=0, d1=0, d2=0;
    for (let i=0;i<v1.length;i++){
      const a=v1[i]-mean1, b=v2[i]-mean2;
      num+=a*b; d1+=a*a; d2+=b*b;
    }
    result[ch[c]] = num / Math.sqrt(d1*d2);
  }
  return result;
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
      const encPath = path.join(OUTPUT_DIR, `${path.parse(imageName).name}_enc_iter${iteration}${modeSuffix}.jpeg`);
      await saveImageDataAsJPEG(enc.image, encPath, QUALITY);

      // --- DESCIFRAR ---
      const encJPEG = await loadImageDataFromFile(encPath);
      const dec = await decryptImage(encJPEG, blockSize, key, enc.extraRows, enc.extraCols);

      //mediciones
      const bcr = computeBitCorrectRatio(original, dec.image);
      const mse = computeMSE(original, dec.image);
      const psnr = computePSNR(mse);
      const corr = pearsonPerChannel(original, dec.image);

      console.log(`   Iteración ${iteration}: bitCorrectRatio = ${(bcr * 100).toFixed(4)}%`);
      iterationStats[iteration - 1].push({ bcr, mse, psnr, corr });


      // --- Verificar si se cruza algún umbral ---
      for (const th of BCR_THRESHOLDS) {
        if (!reached.has(th) && bcr <= th) {
          reached.add(th);
          const decPath = path.join(OUTPUT_DIR, `${path.parse(imageName).name}_b${blockSize}_BCR${Math.round(th * 100)}${modeSuffix}.jpg`);
          await saveImageDataAsJPEG(dec.image, decPath, 1.0);
           results.push({
            image: imageName,
            threshold: th,
            iterations: iteration,
            bcr,
            mse,
            psnr,
            corrR: corr.r,
            corrG: corr.g,
            corrB: corr.b
          });
            console.log(`   🏁 Umbral ${th * 100}% alcanzado en iteración ${iteration}`);
          }
        }

        // --- Preparar siguiente iteración ---
        current = dec.image;

        //si es multiplo de la mitad, en este caso 5 y 10
        if (iteration % (max_iterations / 2) == 0 ){
          const decPath = path.join(OUTPUT_DIR, `${path.parse(imageName).name}_CHECKPOINT_${iteration}${modeSuffix}.jpg`);
          await saveImageDataAsJPEG(dec.image, decPath, 1.0);
            results.push({
            image: imageName,
            threshold: 0,
            iterations: iteration,
            bcr,
            mse,
            psnr,
            corrR: corr.r,
            corrG: corr.g,
            corrB: corr.b
          });
        }

        // --- Limpiar imágenes que no alcanzaron umbral ---
        if (![...reached].includes(bcr)) {
          await fs.remove(encPath).catch(() => {});
        }
      }
    
  }

  await writeCSV(results);

  const avgLines = ["iteracion,promedio_bitCorrectRatio,promedio_MSE,promedio_PSNR,promedio_CorrR,promedio_CorrG,promedio_CorrB"];
  for (let i = 0; i < iterationStats.length; i++) {
    const vals = iterationStats[i];
    if (vals.length === 0) {
      avgLines.push(`${i + 1},0,0,0,0,0,0`);
      continue;
    }
    const avgBCR = vals.map(v => v.bcr).reduce((a,b)=>a+b,0)/vals.length;
    const avgMSE = vals.map(v => v.mse).reduce((a,b)=>a+b,0)/vals.length;
    const avgPSNR = vals.map(v => v.psnr).reduce((a,b)=>a+b,0)/vals.length;
    const avgR = vals.map(v => v.corr.r).reduce((a,b)=>a+b,0)/vals.length;
    const avgG = vals.map(v => v.corr.g).reduce((a,b)=>a+b,0)/vals.length;
    const avgB = vals.map(v => v.corr.b).reduce((a,b)=>a+b,0)/vals.length;
    avgLines.push(`${i + 1},${avgBCR.toFixed(6)},${avgMSE.toFixed(6)},${avgPSNR.toFixed(6)},${avgR.toFixed(6)},${avgG.toFixed(6)},${avgB.toFixed(6)}`);
  }

  fs.writeFileSync(path.join(OUTPUT_DIR,`promedio_iteraciones${modeSuffix}.csv`), avgLines.join("\n"), "utf8");

  // === MENSAJE FINAL ESTILIZADO ===
  const boxTop = "╔" + "═".repeat(55) + "╗";
  const boxBottom = "╚" + "═".repeat(55) + "╝";
  const message = `
  ${boxTop}
  ║${" ".repeat(16)} PROCESO COMPLETADO ${" ".repeat(16)}║
  ║${" ".repeat(8)}Modo de clave: ${useDynamicKey ? "DINÁMICA (por iteración)" : "ESTÁTICA (única clave)"}${" ".repeat(9)}║
  ║${" ".repeat(5)}Archivos generados: resultados_umbral${modeSuffix}.csv${" ".repeat(8)}║
  ║${" ".repeat(15)}y promedio_iteraciones${modeSuffix}.csv${" ".repeat(5)}║
  ${boxBottom}
  `;

  console.log("\x1b[36m%s\x1b[0m", message); // color cian brillante
}

await main();
