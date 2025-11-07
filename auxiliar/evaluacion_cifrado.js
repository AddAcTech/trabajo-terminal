/*
Pipeline de automatización para cifrado/descifrado de imágenes
Usa las funciones encryptImage y decryptImage provistas por el usuario (se importan desde crypto_lib.js)

Dependencias (npm):
  npm install canvas csv-writer glob fs-extra

Colocar el archivo crypto_lib.js (o similar) en la misma carpeta y exportar las funciones:
  - encryptImage(imageData, blockSize, password, applyNoise=false)
  - decryptImage(imageData, blockSize, password, extraRows, extraCols, applyNoise=false)

Uso:
  node pipeline_cifrado_imagenes.js ./input_images ./results "miClaveSegura"

Salida:
  ./results/metrics.csv  -> tabla con métricas por ejecución
  ./results/images/     -> imágenes cifradas, jpeg comprimidas y descifradas
  ./results/histograms/ -> histogramas comparativos (original vs cifrada) por canal

Notas:
  - El script repite para cada imagen: 3 tamaños de bloque (8,16,32).
  - El script asume que las funciones de cifrado/descifrado manejan ImageData del DOM (ImageData {data, width, height}).
  - Se utiliza node-canvas para emular un canvas y obtener ImageData.
*/

const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage, ImageData } = require('canvas');
const { performance } = require('perf_hooks'); // para performance.now()
const glob = require('glob');
const skipHist = process.argv.includes("--nohist");
//const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Exponer globals para que crypto_lib (escrito para navegador) pueda usar ImageData / performance
global.ImageData = ImageData;
global.performance = performance;

const { encryptImage, decryptImage } = require('./cifrado.js');

// Parámetros del pipeline
const BLOCK_SIZES = [8, 16, 32];
const JPEG_QUALITY = 0.85; // 85%

// ---------- Utilidades para convertir entre Canvas ImageData y la estructura esperada ----------
function canvasImageDataToPlain(imageData) {
  // siempre devolver un objeto plano con Uint8ClampedArray copia
  return {
    data: new Uint8ClampedArray(imageData.data), // copia explícita
    width: Number(imageData.width),
    height: Number(imageData.height)
  };
}

function plainToCanvasImageData(plain) {
  // acepta tanto ImageData como objetos planos
  if (plain instanceof ImageData) return plain;
  let data = plain.data;
  if (!(data instanceof Uint8ClampedArray)) data = new Uint8ClampedArray(data);
  const expected = plain.width * plain.height * 4;
  if (data.length !== expected) {
    throw new Error(`Mismatch image data length: data.length=${data.length} expected=${expected}`);
  }
  return new ImageData(data, plain.width, plain.height);
}

function ensurePlainForCrypto(obj, name = 'image') {
  if (!obj) throw new Error(`${name} is null/undefined`);
  if (typeof obj.width !== 'number' || typeof obj.height !== 'number') {
    throw new Error(`${name} width/height inválidos: ${obj && obj.width}x${obj && obj.height}`);
  }
  if (!obj.data) throw new Error(`${name} no tiene propiedad data`);
  // convertir en Uint8ClampedArray si no lo es (copia)
  if (!(obj.data instanceof Uint8ClampedArray)) {
    obj.data = new Uint8ClampedArray(obj.data);
  }
  const expected = obj.width * obj.height * 4;
  if (obj.data.length !== expected) {
    throw new Error(`${name} data length mismatch: ${obj.data.length} != ${expected}`);
  }
  return obj;
}

// pequeño logger utilitario
function logImageInfo(tag, plain) {
  console.log(`${tag}: width=${plain.width} height=${plain.height} dataType=${plain.data && plain.data.constructor && plain.data.constructor.name} length=${plain.data && plain.data.length}`);
}

async function loadImageDataFromFile(filePath) {
  const img = await loadImage(filePath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

async function saveImageDataAsPNG(imageData, outPath) {
  const canvas = createCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d');
  ctx.putImageData(imageData, 0, 0);
  const buffer = canvas.toBuffer('image/png');
  await fs.outputFile(outPath, buffer);
}

async function saveImageDataAsJpeg(imageData, outPath, quality = JPEG_QUALITY) {
  const canvas = createCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d');
  ctx.putImageData(imageData, 0, 0);
  const buffer = canvas.toBuffer('image/jpeg', { quality });
  await fs.outputFile(outPath, buffer);
}

function histogramRGB(imageData) {
  const data = imageData.data;
  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    r[data[i]]++;
    g[data[i + 1]]++;
    b[data[i + 2]]++;
  }
  return { r, g, b };
}

async function saveHistogramComparison(orig, enc, outPrefix) {
  const histO = histogramRGB(orig);
  const histE = histogramRGB(enc);
  const width = 800;
  const height = 250;
  const canvas = createCanvas(width, height * 3);
  const ctx = canvas.getContext('2d');

  function drawBar(channelName, histOrig, histEnc, yOffset) {
    const maxVal = Math.max(...histOrig, ...histEnc, 1);
    const barW = width / 256;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, yOffset, width, height);
    for (let i = 0; i < 256; i++) {
      const hO = (histOrig[i] / maxVal) * (height - 30);
      const hE = (histEnc[i] / maxVal) * (height - 30);
      ctx.fillStyle = 'rgba(50,255,50,0.5)';
      ctx.fillRect(i * barW, yOffset + (height - 10 - hO), barW, hO);
      ctx.strokeStyle = 'rgba(50,50,255,0.5)';
      ctx.strokeRect(i * barW, yOffset + (height - 10 - hE), barW, hE);
    }
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText(channelName + ' (original: Verde, cifrada: Azul)', 8, yOffset + 18);
  }

  drawBar('Red', histO.r, histE.r, 0);
  drawBar('Green', histO.g, histE.g, height);
  drawBar('Blue', histO.b, histE.b, height * 2);

  const buffer = canvas.toBuffer('image/png');
  await fs.outputFile(outPrefix + '.png', buffer);
  return outPrefix + '.png';
}

function computeMSE(orig, proc) {
  if (orig.width !== proc.width || orig.height !== proc.height) throw new Error('Dimensiones distintas en MSE');
  const dataO = orig.data;
  const dataP = proc.data;
  let mse = 0;
  const n = dataO.length / 4;
  for (let i = 0; i < dataO.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const d = dataO[i + c] - dataP[i + c];
      mse += d * d;
    }
  }
  return mse / (n * 3);
}

function computePSNR(mse, maxPixel = 255.0) {
  if (mse === 0) return Infinity;
  return 10 * Math.log10((maxPixel * maxPixel) / mse);
}

function computeSDR(orig, enc) {
  if (!orig || !enc) throw new Error("Faltan imágenes para comparar");
  const ow = orig.width, oh = orig.height;

  // comprobar que otherImage cubre al menos el área original
  console.log(`/t/tCalculando SDR de (${enc.width}x${enc.height}) vs (${ow}x${oh})`)
  if (enc.width != ow || enc.height != oh) {
    throw new Error(`La imagen cifrada tiene diferentes dimensiones (${enc.width}x${enc.height}) que la original (${ow}x${oh})`);
  }
  let num = 0;
  let den = 0;
  for (let i = 0; i < orig.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const s = orig.data[i + c];
      const sh = enc.data[i + c];
      num += s * s;
      const diff = s - sh;
      den += diff * diff;
    }
  }
  return den === 0 ? 99.0 : 10 * Math.log10(num / den);
}

function pearsonPerChannel(orig, proc) {
  if (!orig || !proc) throw new Error("Faltan imágenes para comparar");
  const ow = orig.width, oh = orig.height;

  // comprobar que otherImage cubre al menos el área original
  if (proc.width != ow || proc.height != oh) {
    throw new Error(`La imagen ingresada tiene diferentes dimensiones (${proc.width}x${proc.height}) que la original (${ow}x${oh})`);
  }
  const out = { r: 0, g: 0, b: 0 };
  const dataO = orig.data;
  const dataP = proc.data;
  const n = dataO.length / 4;
  function corrChannel(offset) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = offset; i < dataO.length; i += 4) {
      const x = dataO[i];
      const y = dataP[i];
      sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x; sumY2 += y * y;
    }
    const num = (n * sumXY - sumX * sumY);
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    return den === 0 ? 0 : num / den;
  }
  out.r = corrChannel(0);
  out.g = corrChannel(1);
  out.b = corrChannel(2);
  return out;
}

function shannonEntropy(imageData) {
  const hist = histogramRGB(imageData);
  function ent(h) {
    const total = h.reduce((a, b) => a + b, 0) || 1;
    let e = 0;
    for (let i = 0; i < 256; i++) {
      const p = h[i] / total;
      if (p > 0) e -= p * Math.log2(p);
    }
    return e;
  }
  return { r: ent(hist.r), g: ent(hist.g), b: ent(hist.b), avg: (ent(hist.r) + ent(hist.g) + ent(hist.b)) / 3 };
}

function bitCorrectRatio(orig, dec) {
  if (orig.width !== dec.width || orig.height !== dec.height) throw new Error('Dimensiones distintas en bitCorrectRatio');
  const dO = orig.data;
  const dD = dec.data;
  let totalBits = 0, equalBits = 0;
  for (let i = 0; i < dO.length; i++) {
    const a = dO[i];
    const b = dD[i];
    for (let bit = 0; bit < 8; bit++) {
      totalBits++;
      const ba = (a >> bit) & 1;
      const bb = (b >> bit) & 1;
      if (ba === bb) equalBits++;
    }
  }
  return equalBits / totalBits;
}

function padOriginalImageData(imageData, extraCols, extraRows) {
  const { width, height, data } = imageData;
  const newWidth = width + extraCols;
  const newHeight = height + extraRows;
  const channels = 4; // RGBA
  const padded = new Uint8ClampedArray(newWidth * newHeight * channels);
  padded.fill(0); // relleno negro (puedes usar 255 si prefieres blanco)
  
  for (let y = 0; y < height; y++) {
    const srcStart = y * width * channels;
    const dstStart = y * newWidth * channels;
    padded.set(data.subarray(srcStart, srcStart + width * channels), dstStart);
  }

  return { data: padded, width: newWidth, height: newHeight };
}

function calculateCompressionMetrics(origFilePath, origImageData, encJPEGPath) {
  // Tamaño real del archivo original en bytes
  const originalFileSize = fs.statSync(origFilePath).size;

  // Tamaño estimado de la matriz RGB (ignorando alfa)
  const bytesRGB = origImageData.width * origImageData.height * 3;

  // Tamaño real del JPEG cifrado en bytes
  const encryptedFileSize = fs.statSync(encJPEGPath).size;

  // Grado de compresión respecto a la imagen sin comprimir
  const gradoCompresion = encryptedFileSize / bytesRGB;

  // Espacio ahorrado
  const espacioAhorrado = 1 - gradoCompresion;

  // Relación de compresión respecto a la imagen original en disco
  const relCompresionOriginal = encryptedFileSize / originalFileSize;

  return {
    originalFileSize,
    bytesRGB,
    encryptedFileSize,
    gradoCompresion,
    espacioAhorrado,
    relCompresionOriginal
  };
}

async function createCsv(outDir) {
  const csvPath = path.join(outDir, 'resultados.csv');
  const writer = createCsvWriter({
    path: csvPath,
    header: [
      {id: 'image', title: 'image'},
      {id: 'blockSize', title: 'blockSize'},
      {id: 'width', title: 'width'},
      {id: 'height', title: 'height'},
      {id: 'extraCols', title: 'extraCols'},
      {id: 'extraRows', title: 'extraRows'},
      {id: 'totalBlocks', title: 'totalBlocks'},
      {id: 'encryptTime', title: 'encryptTime_s'},
      {id: 'decryptTime', title: 'decryptTime_s'},
      {id: 'mse', title: 'MSE'},
      {id: 'psnr', title: 'PSNR_dB'},
      {id: 'sdr', title: 'SDR'},
      {id: 'corrEncR', title: 'corrEncR'},
      {id: 'corrEncG', title: 'corrEncG'},
      {id: 'corrEncB', title: 'corrEncB'},
      {id: 'corrDecR', title: 'corrDecR'},
      {id: 'corrDecG', title: 'corrDecG'},
      {id: 'corrDecB', title: 'corrDecB'},
      {id: 'entropyOrigR', title: 'entropyOrig_R'},
      {id: 'entropyOrigG', title: 'entropyOrig_G'},
      {id: 'entropyOrigB', title: 'entropyOrig_B'},
      {id: 'entropyEncR', title: 'entropyEnc_R'},
      {id: 'entropyEncG', title: 'entropyEnc_G'},
      {id: 'entropyEncB', title: 'entropyEnc_B'},
      {id: 'bitCorrectRatio', title: 'bitCorrectRatio'},
      {id: 'gradoCompresion', title: 'gradoCompresion'},
      {id: 'espacioAhorrado', title: 'espacioAhorrado'},
      {id: '', title: ''}
    ]
  });
  return writer;
}

async function processFolder(inputFolder, outFolder, password) {

  const files = glob.sync(`${inputFolder}/*.{png,jpg,jpeg,bmp,tiff}`);
  if (files.length === 0) {
    console.error("No se encontraron imágenes en", inputFolder);
    return;
  }
  // Crear carpetas de salida
  const imagesOut = path.join(outFolder, 'images');
  const histOut = path.join(outFolder, 'histograms');
  await fs.ensureDir(imagesOut);
  await fs.ensureDir(histOut);

  const csvPath = path.join(outFolder, 'metrics.csv');
  //const csvWriter =  createCsv(csvPath);
  const records = [];

  for (const file of files) {
    const base = path.basename(file, path.extname(file));
    console.log('Procesando', base);
    const origImageData = await loadImageDataFromFile(file);

    for (const blockSize of BLOCK_SIZES) {
      console.log(`-> bloque ${blockSize}`);
      try {
        const plain = canvasImageDataToPlain(origImageData);
        ensurePlainForCrypto(plain, 'inputPlain');    // validación
        logImageInfo('Antes encrypt', plain);

        const encResult = await encryptImage(plain, blockSize, password, false);
        // validar lo retornado
        if (!encResult || !encResult.image) throw new Error('encryptImage no devolvió result.image');

        // encResult.image puede ser ImageData o un object plano; normalizamos a objeto plano
        let encPlain;
        if (encResult.image instanceof ImageData) {
            encPlain = canvasImageDataToPlain(encResult.image);
        } else {
            encPlain = ensurePlainForCrypto(encResult.image, 'encPlain');
        }
        logImageInfo('Después encrypt (encPlain)', encPlain);

        // ...guardar JPEG: convertimos a ImageData del canvas
        const encCanvasImg = plainToCanvasImageData(encPlain);
        const encJpegName = `${base}_b${blockSize}_enc.jpg`;
        const encJpegPath = path.join(imagesOut, encJpegName);
        console.log("      Guardando cifrada en:", encJpegPath);
        await saveImageDataAsJpeg(encCanvasImg, encJpegPath, JPEG_QUALITY);

        // cargar el jpeg y descifrar
        const encCompressedImageData = await loadImageDataFromFile(encJpegPath);
        const plainForDecrypt = canvasImageDataToPlain(encCompressedImageData);
        ensurePlainForCrypto(plainForDecrypt, 'encCompressedForDecrypt');
        logImageInfo('Antes decrypt (encCompressed)', plainForDecrypt);

        const decResult = await decryptImage(plainForDecrypt, blockSize, password, encResult.extraRows, encResult.extraCols, false);
        if (!decResult || !decResult.image) throw new Error('decryptImage no devolvió result.image');
        let decPlain;
        if (decResult.image instanceof ImageData) decPlain = canvasImageDataToPlain(decResult.image);
        else decPlain = ensurePlainForCrypto(decResult.image, 'decPlain');
        logImageInfo('Después decrypt (decPlain)', decPlain);

        const decCanvasImg = plainToCanvasImageData(decPlain);
        const decName = `${base}_b${blockSize}_dec.png`;
        const decPath = path.join(imagesOut, decName);
        console.log("      Guardando descifrada en:", decPath);
        await saveImageDataAsPNG(decCanvasImg, decPath);

        // Uso de métricas
        let decForMetrics = decPlain;
        if (decPlain.width !== origImageData.width || decPlain.height !== origImageData.height) {
            const canvasTmp = createCanvas(decPlain.width, decPlain.height);
            const ctxTmp = canvasTmp.getContext('2d');
            ctxTmp.putImageData(plainToCanvasImageData(decPlain), 0, 0);
            const cropped = ctxTmp.getImageData(0, 0, origImageData.width, origImageData.height);
            decForMetrics = { data: cropped.data, width: cropped.width, height: cropped.height };
        }

        // Cálculo de MSE y PSNR con la imagen descifrada
        const mse = computeMSE(origImageData, plainToCanvasImageData(decForMetrics));
        const psnr = computePSNR(mse);
        

        // Crear versión padded de la imagen original
        const paddedOrig = padOriginalImageData(origImageData, encResult.extraCols, encResult.extraRows);

        //Calculo relación señal/distorsión, con la imagen padded
        const sdr = computeSDR(paddedOrig, plainToCanvasImageData(encPlain));


        // Correlaciones — ahora dos: cifrada y descifrada
        const corrEnc = pearsonPerChannel(paddedOrig, plainToCanvasImageData(encPlain));
        const corrDec = pearsonPerChannel(origImageData, plainToCanvasImageData(decForMetrics));

        // Entropías — original y cifrada
        const entropyOrig = shannonEntropy(origImageData);
        const entropyEnc = shannonEntropy(plainToCanvasImageData(encPlain));

        // === HISTOGRAMA ===
        if (!skipHist) {
          const histName = `${base}_b${blockSize}_hist`;
          const histPath = path.join(histOut, histName + '.png');
          await saveHistogramComparison(origImageData, plainToCanvasImageData(encPlain), path.join(histOut, histName));

        } else {
          console.log("↳ Histogramas omitidos (modo rápido activado)");
        }
        
        // === RAZÓN DE BITS CORRECTOS ===
        const bitRatio = bitCorrectRatio(origImageData, decCanvasImg);

        //COMPRESION
        const path_origin = path.join(inputFolder,path.basename(file));
        const comp = calculateCompressionMetrics(path_origin, origImageData, encJpegPath);

        // === REGISTRO DE RESULTADOS ===
        records.push({
            image: base,
            blockSize,
            width: origImageData.width,
            height: origImageData.height,
            extraCols: encResult.extraCols || 0,
            extraRows: encResult.extraRows || 0,
            totalBlocks: encResult.totalBlock || ((encPlain.width * encPlain.height) / (blockSize * blockSize)),
            encryptTime: encResult.time,
            decryptTime: decResult.time,
            mse,
            psnr,
            sdr,
            // Correlaciones con imagen cifrada
            corrEncR: corrEnc.r,
            corrEncG: corrEnc.g,
            corrEncB: corrEnc.b,

            // Correlaciones con imagen descifrada
            corrDecR: corrDec.r,
            corrDecG: corrDec.g,
            corrDecB: corrDec.b,

            entropyOrigR: entropyOrig.r,
            entropyOrigG: entropyOrig.g,
            entropyOrigB: entropyOrig.b,

            entropyEncR: entropyEnc.r,
            entropyEncG: entropyEnc.g,
            entropyEncB: entropyEnc.b,

            bitCorrectRatio: bitRatio,
            gradoCompresion: comp.gradoCompresion,
            espacioAhorrado: comp.espacioAhorrado,
            relCompresionOriginal: comp.relCompresionOriginal
            /*
            encJpegPath: path.relative(outFolder, encJpegPath),
            decImagePath: path.relative(outFolder, decPath),
            histPath: path.relative(outFolder, histPath) */
        });

        //await csvWriter.writeRecords(records);
        // --- Guardar CSV manualmente ---
        if (records.length > 0) {
            const headers = Object.keys(records[0]).join(",");
            const rows = records.map(r =>
            Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
        );
        const csvContent = [headers, ...rows].join("\n");

        await fs.writeFile(csvPath, csvContent, "utf8");
        console.log(`\nProceso terminado. Métricas guardadas en: ${csvPath}`);
        } else {
            console.warn("\nNo se generaron registros, CSV vacío.");
        }
      } catch (err) {
        console.error('Error en bloque', blockSize, 'imagen', base);
        console.error(err && err.stack ? err.stack : err);
        // opcional: continuar con siguiente imagen en vez de abortar:
        continue;
      }
    }
  }

  console.log('Proceso completado. CSV y archivos en', outFolder);
}



async function main() {
  console.log("process.argv =", process.argv);
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Uso: node pipeline_cifrado_imagenes.js <input_folder> <out_folder> <password>');
    process.exit(1);
  }
  const [inputFolder, outFolder, password] = args;
  console.log(`🟦 Carpeta de entrada: ${inputFolder}`);
  console.log(`🟩 Carpeta de salida:  ${outFolder}`);
  console.log(`🔐 Clave:      ${password}`);
  await processFolder(inputFolder, outFolder, password);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
