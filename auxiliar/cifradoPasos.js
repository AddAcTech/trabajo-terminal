let lastImageData = null;
document.getElementById("imageForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const file = document.getElementById("imageInput").files[0];
  const password = document.getElementById("password").value;
  const blockSize = parseInt(document.getElementById("blockSize").value, 10);
  const reverseMode = document.getElementById("reverseMode").checked;
  const applyNoise = false; //document.getElementById("applyNoise").checked;

  if (!file || !password || !blockSize || blockSize <= 0) {
    alert("Todos los campos son requeridos.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (event) {
    const img = new Image();
    img.onload = async function () {
      const canvasOriginal = document.getElementById("canvas-original");
      const ctxOriginal = canvasOriginal.getContext("2d");

      canvasOriginal.width = img.width;
      canvasOriginal.height = img.height;
      ctxOriginal.drawImage(img, 0, 0);
      const originalImageData = ctxOriginal.getImageData(0, 0, img.width, img.height);

      document.getElementById("step-original").style.display = "block";

      const hashArray = await hashPassword(password);
      const prngBlock = createHashPRNG(hashArray, 0);

      // Paso 1: Padding
      const { imageData: padded, extraCols, extraRows } = padImageData(originalImageData, blockSize);
      const canvasPadded = document.getElementById("canvas-padded");
      const ctxPadded = canvasPadded.getContext("2d");
      canvasPadded.width = padded.width;
      canvasPadded.height = padded.height;
      ctxPadded.putImageData(padded, 0, 0);
      document.getElementById("step-padded").style.display = "block";

      let currentImage = new ImageData(new Uint8ClampedArray(padded.data), padded.width, padded.height);

      // Paso 2: Permutación de bloques
      const totalBlocks = (padded.width / blockSize) * (padded.height / blockSize);
      const seed64 = hashArray.slice(0, 8).reduce((acc, val, i) => acc + (val << (i * 8)), 0);
      const permutation = generatePermutationWithPI(totalBlocks, seed64);
      //const permutation = generateDeterministicPermutation(totalBlocks, prngBlock);
      currentImage = permuteBlocks(currentImage, blockSize, permutation);
      const canvasPermuted = document.getElementById("canvas-permuted");
      const ctxPermuted = canvasPermuted.getContext("2d");
      canvasPermuted.width = currentImage.width;
      canvasPermuted.height = currentImage.height;
      ctxPermuted.putImageData(currentImage, 0, 0);
      document.getElementById("step-permuted").style.display = "block";

      // Paso 3: Desplazamiento circular por bloque
      const shiftPRNG = createHashPRNG(hashArray, totalBlocks);
      const blocksX = currentImage.width / blockSize;
      const blocksY = currentImage.height / blockSize;
      for (let by = 0; by < blocksY; by++) {
        for (let bx = 0; bx < blocksX; bx++) {
          const shift = shiftPRNG() % (blockSize * blockSize);
          shiftBlock(currentImage, blockSize, bx * blockSize, by * blockSize, shift);
        }
      }

      // Paso 4: Permutación de canales RGB
      const channelPRNG = createHashPRNG(hashArray, totalBlocks * 2);
      permuteChannels(currentImage, blockSize, channelPRNG, false);

      // Paso 5: Transformación negativa-positiva
      const negPRNG = createHashPRNG(hashArray, totalBlocks * 3);
      applyNegativeTransform(currentImage, negPRNG);

      // Mostrar imagen final
      const canvasFinal = document.getElementById("canvas-final");
      const ctxFinal = canvasFinal.getContext("2d");
      canvasFinal.width = currentImage.width;
      canvasFinal.height = currentImage.height;
      ctxFinal.putImageData(currentImage, 0, 0);
      document.getElementById("step-final").style.display = "block";

      // Activar botones de descarga
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
        link.download = "imagen_resultado.jpg";
        link.href = canvasFinal.toDataURL("image/jpeg", 0.95);
        link.click();
      };
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
});

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
    const blockPRNG = createHashPRNG(hashArray, 0);
    const shiftPRNG = createHashPRNG(hashArray, totalBlocks);
    const channelPRNG = createHashPRNG(hashArray, totalBlocks * 2);
    const negPRNG = createHashPRNG(hashArray, totalBlocks * 3);
    const noisePRNG = createHashPRNG(hashArray, totalBlocks * 4);
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
        const shift = shiftPRNG() % (blockSize * blockSize);
        shiftBlock(resultImage, blockSize, x, y, shift);
      }
    }
  
    permuteChannels(resultImage, blockSize, channelPRNG, false);
    applyNegativeTransform(resultImage, negPRNG);
  
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
  
    const blockPRNG = createHashPRNG(hashArray, 0);
    const shiftPRNG = createHashPRNG(hashArray, totalBlocks);
    const channelPRNG = createHashPRNG(hashArray, totalBlocks * 2);
    const negPRNG = createHashPRNG(hashArray, totalBlocks * 3);
    const noisePRNG = createHashPRNG(hashArray, totalBlocks * 4);
    //console.log("BloquesX:", blocksX, "BloquesY:", blocksY, "Total:", totalBlocks);
    //const permutation = generateDeterministicPermutation(totalBlocks, blockPRNG);
    const seed64 = hashArray.slice(0, 8).reduce((acc, val, i) => acc + (val << (i * 8)), 0);
    const permutation = generatePermutationWithPI(totalBlocks, seed64);

    const invertedPermutation = invertPermutation(permutation);
  
    if (!Number.isFinite(width) || !Number.isFinite(height)) throw new Error("Dimensiones inválidas");
    let resultImage = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
  
    if (applyNoise) resultImage = applyNoiseXOR(resultImage, noisePRNG);
  
    applyNegativeTransform(resultImage, negPRNG);
    permuteChannels(resultImage, blockSize, channelPRNG, true);
  
    for (let by = 0; by < heightInBlocks; by++) {
      for (let bx = 0; bx < widthInBlocks; bx++) {
        const x = bx * blockSize;
        const y = by * blockSize;
        const shift = shiftPRNG() % (blockSize * blockSize);
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
      const j = rng() % (i + 1);
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
  function permuteChannels(imageData, blockSize, prng, reverse) {
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
        const val = prng() % 6;
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
  
    return new ImageData(data, width, height);
  }
  
  /**
   * Aplica inversión de color por píxel usando PRNG.
   * Complejidad temporal: O(pixels)
   * Complejidad espacial: O(1)
   */
  function applyNegativeTransform(imageData, prng) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const useNegative = prng() % 2 === 1;
      if (useNegative) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
    }
    return new ImageData(data, imageData.width, imageData.height);
  }
  
  /**
   * Aplica ruido reversible con XOR pseudoaleatorio basado en hash.
   * Complejidad temporal: O(pixels)
   * Complejidad espacial: O(1)
   */
  function applyNoiseXOR(imageData, prng) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] ^= prng();     // R
      data[i + 1] ^= prng(); // G
      data[i + 2] ^= prng(); // B
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