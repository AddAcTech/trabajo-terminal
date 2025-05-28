let lastImageData = null;
document.getElementById("imageForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const file = document.getElementById("imageInput").files[0];
  const password = document.getElementById("password").value;
  const blockSize = parseInt(document.getElementById("blockSize").value, 10);
  const reverseMode = document.getElementById("reverseMode").checked;
  const applyNoise = false; //document.getElementById("applyNoise").checked;

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const output = document.getElementById("output");

  if (!file || !password || !blockSize || blockSize <= 0) {
    alert("Todos los campos son requeridos.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (event) {
    const img = new Image();
    img.onload = async function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      let imageData = ctx.getImageData(0, 0, img.width, img.height);

      const extraCols = parseInt(document.getElementById("extraCols").value, 10) || 0;
      const extraRows = parseInt(document.getElementById("extraRows").value, 10) || 0;
      const result = reverseMode
      ? await decryptImageStepByStep(imageData, blockSize, password, extraRows, extraCols, applyNoise)
      : await encryptImageStepByStep(imageData, blockSize, password, applyNoise);
      if (!reverseMode){
        document.getElementById("extraCols").value = result.extraCols;
        document.getElementById("extraRows").value = result.extraRows;
      }
      const container = document.getElementById("stepsContainer");
      container.innerHTML = ""; // limpiar pasos anteriores

      result.steps.forEach((step, index) => {
        const stepDiv = document.createElement("div");
        stepDiv.className = "step";

        const title = document.createElement("div");
        title.className = "step-title";
        title.id = `label-step-${index}`;
        title.textContent = step.label;

        const canvas = document.createElement("canvas");
        canvas.id = `canvas-step-${index}`;
        canvas.width = step.image.width;
        canvas.height = step.image.height;
        canvas.getContext("2d").putImageData(step.image, 0, 0);

        stepDiv.appendChild(title);
        stepDiv.appendChild(canvas);
        container.appendChild(stepDiv);
      });


    for (let i = 0; i < result.steps.length; i++) {
      const canvas = document.getElementById(`canvas-step-${i}`);
      const ctx = canvas.getContext("2d");
      const { width, height, data } = result.steps[i].image;
      canvas.width = width;
      canvas.height = height;
      ctx.putImageData(result.steps[i].image, 0, 0);

      document.getElementById(`label-step-${i}`).textContent = result.steps[i].label;
    }

      // Activar botones de descarga
      canvasFinal = document.getElementById("canvas-step-5");

      document.getElementById("downloadBtn").style.display = "inline-block";
      document.getElementById("downloadBtn").onclick = () => {
        const link = document.createElement("a");
        link.download = "imagen_resultado.png";
        link.href = canvasFinal.toDataURL("image/png");
        link.click();
      };

      document.getElementById("downloadJpgBtn").style.display = "inline-block";
      document.getElementById("downloadJpgBtn").onclick = () => {
        const link = document.createElement("a");
        link.download = "resultado_JPEG.jpg";
        link.href = canvasFinal.toDataURL("image/jpeg", 0.95);
        link.click();
      };
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
});

async function encryptImageStepByStep(imageData, blockSize, password, applyNoise = false) {
  const steps = [];

  const hashArray = await hashPassword(password);

  const { imageData: padded, extraCols, extraRows } = padImageData(imageData, blockSize);
  steps.push({ label: "🖼️ Imagen Original", image: imageData });
  steps.push({ label: "➕ Padding Aplicado", image: padded });

  const totalBlocks = (padded.width / blockSize) * (padded.height / blockSize);
  const prngBlock = await createSecurePRNG(hashArray, 0);
  const seed64 = hashArray.slice(0, 8).reduce((acc, val, i) => acc + (val << (i * 8)), 0);
  const permutation = generatePermutationWithPI(totalBlocks, seed64);
  let current = permuteBlocks(padded, blockSize, permutation);
  steps.push({ label: "🔀 Permutación de Bloques", image: new ImageData(new Uint8ClampedArray(current.data), current.width, current.height) });

  const shiftPRNG = await createSecurePRNG(hashArray, 0);
  const blocksX = current.width / blockSize;
  const blocksY = current.height / blockSize;

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const shift = Math.floor(await shiftPRNG() * (blockSize * blockSize));
      shiftBlock(current, blockSize, bx * blockSize, by * blockSize, shift);
    }
  }
  steps.push({ label: "🔄 Desplazamiento Circular por Bloques", image: new ImageData(new Uint8ClampedArray(current.data), current.width, current.height) });

  const channelPRNG = await createSecurePRNG(hashArray, totalBlocks * 2);
  await permuteChannels(current, blockSize, channelPRNG, false);
  steps.push({ label: "🎨 Permutación de Canales RGB", image: new ImageData(new Uint8ClampedArray(current.data), current.width, current.height) });

  const negPRNG = await createSecurePRNG(hashArray, totalBlocks * 3);
  await applyBlockLevelNegativeTransform(current, blockSize, negPRNG);
  steps.push({ label: "🎭 Transformación Negativa-Positiva", image: new ImageData(new Uint8ClampedArray(current.data), current.width, current.height) });

  return { steps, extraRows, extraCols };
}


 async function encryptImage(imageData, blockSize, password, applyNoise = false) {
    console.log("Block Size:", blockSize);
    console.log("ImageData:", imageData);
    console.log("Width x Height:", imageData.width, imageData.height);
    const t0 = performance.now();
  
    const { imageData: paddedImageData, extraCols, extraRows } = padImageData(imageData, blockSize);
    const { width, height } = paddedImageData;
    const widthInBlocks = Math.ceil(width / blockSize);
    const heightInBlocks = Math.ceil(height / blockSize);
    const totalBlocks = widthInBlocks * heightInBlocks;
    console.log(totalBlocks)
    const hashArray = await hashPassword(password);
    console.log(hashArray)
    const blockPRNG = await createSecurePRNG(hashArray, 0);
    const shiftPRNG = await createSecurePRNG(hashArray, totalBlocks);
    const channelPRNG = await createSecurePRNG(hashArray, totalBlocks * 2);
    const negPRNG = await createSecurePRNG(hashArray, totalBlocks * 3);
    const noisePRNG = await createSecurePRNG(hashArray, totalBlocks * 4);
    //console.log("BloquesX:", blocksX, "BloquesY:", blocksY, "Total:", totalBlocks);
    const seed64 = hashArray.slice(0, 8).reduce((acc, val, i) => acc + (val << (i * 8)), 0);
    const permutation = generatePermutationWithPI(totalBlocks, seed64);
    //const permutation = generateDeterministicPermutation(totalBlocks, blockPRNG);
    //console.log("Existe la permutación")
    let resultImage = permuteBlocks(paddedImageData, blockSize, permutation);
    //console.oog("Hice la permutación")
    for (let by = 0; by < heightInBlocks; by++) {
      for (let bx = 0; bx < widthInBlocks; bx++) {
        const x = bx * blockSize;
        const y = by * blockSize;
        const shift = Math.floor (await shiftPRNG() * (blockSize * blockSize));
        shiftBlock(resultImage, blockSize, x, y, shift);
      }
    }
  
    await permuteChannels(resultImage, blockSize, channelPRNG, false);
    await applyBlockLevelNegativeTransform(resultImage, blockSize, negPRNG);
  
    if (applyNoise) resultImage = applyNoiseXOR(resultImage, noisePRNG);
  
    const t1 = performance.now();
    return {
      image: resultImage,
      extraRows: extraRows,
      extraCols: extraCols,
      time: ((t1 - t0) / 1000).toFixed(2)
    };
  }
  
async function decryptImage(imageData, blockSize, password, extraRows, extraCols, applyNoise = false) {
    console.log("Block Size:", blockSize);
    console.log("ImageData:", imageData);
    console.log("Width x Height:", imageData.width, imageData.height);
    const t0 = performance.now();
  
    const { width, height } = imageData;
    const widthInBlocks = Math.ceil(width / blockSize);
    const heightInBlocks = Math.ceil(height / blockSize);
    const totalBlocks = widthInBlocks * heightInBlocks;
  
    const hashArray = await hashPassword(password);
  
    const blockPRNG = await createSecurePRNG(hashArray, 0);
    const shiftPRNG = await createSecurePRNG(hashArray, totalBlocks);
    const channelPRNG = await createSecurePRNG(hashArray, totalBlocks * 2);
    const negPRNG = await createSecurePRNG(hashArray, totalBlocks * 3);
    const noisePRNG = await createSecurePRNG(hashArray, totalBlocks * 4);
    //console.log("BloquesX:", blocksX, "BloquesY:", blocksY, "Total:", totalBlocks);
    //const permutation = generateDeterministicPermutation(totalBlocks, blockPRNG);
    const seed64 = hashArray.slice(0, 8).reduce((acc, val, i) => acc + (val << (i * 8)), 0);
    const permutation = generatePermutationWithPI(totalBlocks, seed64);

    const invertedPermutation = invertPermutation(permutation);
  
    if (!Number.isFinite(width) || !Number.isFinite(height)) throw new Error("Dimensiones inválidas");
    let resultImage = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
  
    if (applyNoise) resultImage = applyNoiseXOR(resultImage, noisePRNG);
  
    await applyBlockLevelNegativeTransform(resultImage, blockSize,negPRNG);
    await permuteChannels(resultImage, blockSize, channelPRNG, true);
  
    for (let by = 0; by < heightInBlocks; by++) {
      for (let bx = 0; bx < widthInBlocks; bx++) {
        const x = bx * blockSize;
        const y = by * blockSize;
        const shift = Math.floor (await shiftPRNG() * (blockSize * blockSize));
        shiftBlock(resultImage, blockSize, x, y, (blockSize * blockSize - shift) % (blockSize * blockSize));
      }
    }
  
    resultImage = permuteBlocks(resultImage, blockSize, invertedPermutation);
  
    const cropped = cropImageData(resultImage, width - extraCols, height - extraRows);
  
    const t1 = performance.now();
    return {
      image: cropped,
      time: ((t1 - t0) / 1000).toFixed(2)
    };
  }

async function decryptImageStepByStep(imageData, blockSize, password, extraRows = 0, extraCols = 0, applyNoise = false) {
  const steps = [];

  steps.push({ label: "🎯 Imagen Final Cifrada", image: imageData });

  const hashArray = await hashPassword(password);
  const totalBlocks = (imageData.width / blockSize) * (imageData.height / blockSize);
  let current = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);

  const negPRNG = await createSecurePRNG(hashArray, totalBlocks * 3);
  await applyBlockLevelNegativeTransform(current, blockSize, negPRNG);
  steps.push({ label: "🎭 Reversión de Negativo-Positivo", image: new ImageData(new Uint8ClampedArray(current.data), current.width, current.height) });

  const channelPRNG = await createSecurePRNG(hashArray, totalBlocks * 2);
  await permuteChannels(current, blockSize, channelPRNG, true);
  steps.push({ label: "🎨 Reversión de Canales RGB", image: new ImageData(new Uint8ClampedArray(current.data), current.width, current.height) });

  const shiftPRNG = await createSecurePRNG(hashArray, 0);
  const blocksX = current.width / blockSize;
  const blocksY = current.height / blockSize;

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const shift = Math.floor(await shiftPRNG() * (blockSize * blockSize));
      const inverseShift = (blockSize * blockSize - shift) % (blockSize * blockSize);
      shiftBlock(current, blockSize, bx * blockSize, by * blockSize, inverseShift);
    }
  }
  steps.push({ label: "🔄 Reversión de Desplazamientos por Bloque", image: new ImageData(new Uint8ClampedArray(current.data), current.width, current.height) });

  const prngBlock = await createSecurePRNG(hashArray, 0);
  const seed64 = hashArray.slice(0, 8).reduce((acc, val, i) => acc + (val << (i * 8)), 0);
  const permutation = generatePermutationWithPI(totalBlocks, seed64);
  const inverted = invertPermutation(permutation);
  current = permuteBlocks(current, blockSize, inverted);
  steps.push({ label: "🔀 Reversión Permutación de Bloques", image: new ImageData(new Uint8ClampedArray(current.data), current.width, current.height) });

  const cropped = cropImageData(current, current.width - extraCols, current.height - extraRows);
  steps.push({ label: "🧼 Imagen Recortada", image: cropped });

  return { steps };
}


  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }

  function padImageData(imageData, blockSize) {
    const { width, height, data } = imageData;
    const extraCols = (blockSize - (width % blockSize)) % blockSize;
    const extraRows = (blockSize - (height % blockSize)) % blockSize;
    const newWidth = width + extraCols;
    const newHeight = height + extraRows;
  
    if (!Number.isFinite(blockSize) || blockSize <= 0) throw new Error("blockSize inválido");
    if (!Number.isFinite(width) || !Number.isFinite(height)) throw new Error("Dimensiones inválidas");
    const paddedData = new Uint8ClampedArray(newWidth * newHeight * 4);
  
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = (y * width + x) * 4;
        const dstIndex = (y * newWidth + x) * 4;
        paddedData.set(data.slice(srcIndex, srcIndex + 4), dstIndex);
      }
    }
  
    return {
      imageData: new ImageData(paddedData, newWidth, newHeight),
      extraCols,
      extraRows
    };
  }
  
// FUNCIONES AUXILIARES

async function createSecurePRNG(seedBytes, offset = 0) {
  let counter = offset;

  return async function () {
    const input = new Uint8Array(seedBytes.length + 4);
    input.set(seedBytes);
    input.set([
      (counter >>> 24) & 0xff,
      (counter >>> 16) & 0xff,
      (counter >>> 8) & 0xff,
      counter & 0xff
    ], seedBytes.length);

    counter++;

    const hash = await crypto.subtle.digest("SHA-256", input);
    const hashArray = new Uint8Array(hash);

    // Extraer número en rango [0, 1)
    const intVal = (hashArray[0] << 24 | hashArray[1] << 16 | hashArray[2] << 8 | hashArray[3]) >>> 0;
    return intVal / 0xFFFFFFFF;
  };
}

function createHashPRNG(hashArray, offset = 0) {
    let index = offset;
    return () => {
      const val = hashArray[index % hashArray.length];
      index++;
      return val;
    };
  }
  
  /**
   * Genera una permutación determinística usando el algoritmo Fisher-Yates.
   * Complejidad temporal: O(n)
   * Complejidad espacial: O(n)
   */
  function generateDeterministicPermutation(count, rng) {
    const indices = [...Array(count).keys()];
    for (let i = count - 1; i > 0; i--) {
      const j = rng() * (i + 1);
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }
  
  function rotatePermutation(perm, steps, direction = 'right') {
    const len = perm.length;
    steps = steps % len;
    if (steps === 0) return [...perm];
  
    if (direction === 'left') {
      return [...perm.slice(steps), ...perm.slice(0, steps)];
    } else {
      return [...perm.slice(-steps), ...perm.slice(0, -steps)];
    }
  }
  
  function invertPermutation(permutation) {
    const inverse = [];
    permutation.forEach((val, i) => {
      inverse[val] = i;
    });
    return inverse;
  }
  
  /**
   * Aplica una permutación a bloques MxM dentro de una imagen.
   * Complejidad temporal: O(n * M^2) donde n = bloques totales
   * Complejidad espacial: O(pixels) -> tamaño total de la imagen
   */
  function permuteBlocks(imageData, blockSize, permutation) {
    const { width, height, data } = imageData;
    const widthInBlocks = Math.ceil(width / blockSize);
    if (!Number.isFinite(blockSize) || blockSize <= 0) throw new Error("blockSize inválido");
    if (!Number.isFinite(width) || !Number.isFinite(height)) throw new Error("Dimensiones inválidas");
    const result = new Uint8ClampedArray(data.length);
  
    for (let i = 0; i < permutation.length; i++) {
      const srcIdx = permutation[i];
      const srcX = (srcIdx % widthInBlocks) * blockSize;
      const srcY = Math.floor(srcIdx / widthInBlocks) * blockSize;
  
      const dstX = (i % widthInBlocks) * blockSize;
      const dstY = Math.floor(i / widthInBlocks) * blockSize;
  
      for (let y = 0; y < blockSize; y++) {
        for (let x = 0; x < blockSize; x++) {
          const sx = srcX + x;
          const sy = srcY + y;
          const dx = dstX + x;
          const dy = dstY + y;
  
          if (sx >= width || sy >= height || dx >= width || dy >= height) continue;
  
          const srcPos = (sy * width + sx) * 4;
          const dstPos = (dy * width + dx) * 4;
  
          result[dstPos] = data[srcPos];
          result[dstPos + 1] = data[srcPos + 1];
          result[dstPos + 2] = data[srcPos + 2];
          result[dstPos + 3] = data[srcPos + 3];
        }
      }
    }
  
    return new ImageData(result, width, height);
  }
  
  /**
   * Aplica desplazamiento circular a todo el bloque (de tamaño MxM).
   * Se lee el bloque como un array lineal de píxeles y se aplica una rotación circular.
   * Complejidad temporal: O(M²)
   * Complejidad espacial: O(M²)
   */
  function shiftBlock(imageData, blockSize, startX, startY, shiftAmount) {
    const { width, height, data } = imageData;
    const pixels = [];
  
    // 1. Extraer píxeles válidos en bloque MxM
    for (let y = 0; y < blockSize; y++) {
      for (let x = 0; x < blockSize; x++) {
        const px = startX + x;
        const py = startY + y;
        if (px >= width || py >= height) continue;
  
        const idx = (py * width + px) * 4;
        if (idx + 3 < data.length) {
          pixels.push(data.slice(idx, idx + 4));
        }
      }
    }
  
    const count = pixels.length;
    if (count === 0) return;
  
    const offset = shiftAmount % count;
  
    // 2. Desplazamiento circular (derecha)
    const rotated = pixels.slice(-offset).concat(pixels.slice(0, -offset));
  
    // 3. Volver a escribir en imagen (dentro de límites)
    let i = 0;
    for (let y = 0; y < blockSize; y++) {
      for (let x = 0; x < blockSize; x++) {
        const px = startX + x;
        const py = startY + y;
        if (px >= width || py >= height) continue;
  
        const idx = (py * width + px) * 4;
        if (idx + 3 < data.length && i < rotated.length) {
          data.set(rotated[i], idx);
          i++;
        }
      }
    }
  }
  
  /**
   * Aplica una permutación RGB a cada bloque MxM en la imagen.
   * Complejidad temporal: O(pixels)
   * Complejidad espacial: O(1) -> se modifica en sitio
   */
  async function permuteChannels(imageData, blockSize, prng, reverse) {
    console.log("Ejecutando permutación de canales...");
    const { width, height, data } = imageData;
    const widthInBlocks = Math.ceil(width / blockSize);
    const heightInBlocks = Math.ceil(height / blockSize);
  
    const permutations = [
      [0, 1, 2], [0, 2, 1], [1, 0, 2],
      [1, 2, 0], [2, 0, 1], [2, 1, 0]
    ];
    const inversePermutations = permutations.map(p => {
      const inv = [];
      for (let i = 0; i < 3; i++) inv[p[i]] = i;
      return inv;
    });
  
    for (let by = 0; by < heightInBlocks; by++) {
      for (let bx = 0; bx < widthInBlocks; bx++) {
        let perm;
        const val = Math.floor(await prng() * 6) ; //remover % 6 con el generador más seguro
        perm = reverse ? inversePermutations[val] : permutations[val];
  
        for (let y = 0; y < blockSize; y++) {
          for (let x = 0; x < blockSize; x++) {
            const px = bx * blockSize + x;
            const py = by * blockSize + y;
            if (px >= width || py >= height) continue;
  
            const idx = (py * width + px) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
  
            const rgb = [r, g, b];
            data[idx] = rgb[perm[0]];
            data[idx + 1] = rgb[perm[1]];
            data[idx + 2] = rgb[perm[2]];
          }
        }
      }
    }
    console.log("Acabé de permutar");
    return new ImageData(data, width, height);
  }
  
  /**
   * Aplica inversión de color por píxel usando PRNG.
   * Complejidad temporal: O(pixels)
   * Complejidad espacial: O(1)
   */
  async function applyNegativeTransform(imageData, prng) {
    console.log("Ejecutando transformaciones");
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const useNegative = ( Math.floor(await prng() * 2 ) ) === 1;
      if (useNegative) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
    }
    console.log("Acabé de transformar");
    return new ImageData(data, imageData.width, imageData.height);
  }

/**
 * Aplica transformación negativa-positiva por bloque completo.
 * Cada bloque se invierte completamente o se deja igual.
 * @param {ImageData} imageData
 * @param {number} blockSize
 * @param {function} prng - Generador asíncrono que retorna float entre 0 y 1
 */
async function applyBlockLevelNegativeTransform(imageData, blockSize, prng) {
  console.log("transformando...")
  const { width, height, data } = imageData;
  const blocksX = Math.ceil(width / blockSize);
  const blocksY = Math.ceil(height / blockSize);

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const invert = (await prng()) <= 0.5;

      if (!invert) continue;

      for (let y = 0; y < blockSize; y++) {
        for (let x = 0; x < blockSize; x++) {
          const px = bx * blockSize + x;
          const py = by * blockSize + y;
          if (px >= width || py >= height) continue;

          const idx = (py * width + px) * 4;
          data[idx] = 255 - data[idx];     // R
          data[idx + 1] = 255 - data[idx + 1]; // G
          data[idx + 2] = 255 - data[idx + 2]; // B
        }
      }
    }
  }
  console.log("Acabé de transformar")
  return new ImageData(data, imageData.width, imageData.height);
}

/**
   * Aplica ruido reversible con XOR pseudoaleatorio basado en hash.
   * Complejidad temporal: O(pixels)
   * Complejidad espacial: O(1)
   */
async function applyNoiseXOR(imageData, prng) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] ^= Math.floor (await prng() * 255);     // R
      data[i + 1] ^= Math.floor (await prng() * 255); // G
      data[i + 2] ^= Math.floor (await prng() * 255); // B
      // Alpha queda intacto
    }
    return new ImageData(data, imageData.width, imageData.height);
  }
  
function cropImageData(imageData, targetWidth, targetHeight) {
    const { width, data } = imageData;
    const croppedData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
  
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const srcIdx = (y * width + x) * 4;
        const dstIdx = (y * targetWidth + x) * 4;
        croppedData.set(data.slice(srcIdx, srcIdx + 4), dstIdx);
      }
    }
  
    return new ImageData(croppedData, targetWidth, targetHeight);
  }
  
function generatePermutationWithPI(n, seed64) {
    const PI = Math.PI;
    const A = [];
    // Paso 1: multiplicar el número aleatorio por PI varias veces
    for (let i = 0; i < n; i++) {
      const mixed = (seed64 + i) * PI;
      const fractional = mixed - Math.floor(mixed); // parte decimal
      A.push(fractional);
    }
    // Paso 2: construir coeficientes
    const coefficients = A.map(a => Math.floor(a * 1e12) % (n + 1));
    // Paso 3: aplicar los coeficientes al arreglo base [0..n-1] usando Fisher-Yates modificado
    const perm = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = coefficients[i] % (i + 1);
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    return perm;
  }