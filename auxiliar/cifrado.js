export async function encryptImage(imageData, blockSize, password, applyNoise = false) {
    const t0 = performance.now();
  
    const padded = padImageData(imageData, blockSize);
    const { width, height } = padded;
    const widthInBlocks = Math.ceil(width / blockSize);
    const heightInBlocks = Math.ceil(height / blockSize);
    const totalBlocks = widthInBlocks * heightInBlocks;
  
    const hashArray = await hashPassword(password);
  
    const blockPRNG = createHashPRNG(hashArray, 0);
    const shiftPRNG = createHashPRNG(hashArray, totalBlocks);
    const channelPRNG = createHashPRNG(hashArray, totalBlocks * 2);
    const negPRNG = createHashPRNG(hashArray, totalBlocks * 3);
    const noisePRNG = createHashPRNG(hashArray, totalBlocks * 4);
  
    const permutation = generateDeterministicPermutation(totalBlocks, blockPRNG);
  
    let resultImage = permuteBlocks(padded, blockSize, permutation);
  
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
      extraRows: padded.height - imageData.height,
      extraCols: padded.width - imageData.width,
      time: ((t1 - t0) / 1000).toFixed(2)
    };
  }
  
  export async function decryptImage(imageData, blockSize, password, extraRows, extraCols, applyNoise = false) {
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
  
    const permutation = generateDeterministicPermutation(totalBlocks, blockPRNG);
    const invertedPermutation = invertPermutation(permutation);
  
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
    const { width, data } = imageData;
    const pixelCount = blockSize * blockSize;
    const pixelData = new Uint8ClampedArray(pixelCount * 4);
  
    let i = 0;
  
    // Extraer píxeles linealmente del bloque
    for (let y = 0; y < blockSize; y++) {
      for (let x = 0; x < blockSize; x++) {
        const px = startX + x;
        const py = startY + y;
        if (px >= imageData.width || py >= imageData.height) continue;
  
        const idx = (py * width + px) * 4;
        pixelData.set(data.slice(idx, idx + 4), i * 4);
        i++;
      }
    }
  
    // Aplicar rotación circular
    const shifted = new Uint8ClampedArray(pixelData.length);
    const actualShift = shiftAmount % i;
    for (let j = 0; j < i; j++) {
      const target = (j + actualShift) % i;
      shifted.set(pixelData.slice(j * 4, j * 4 + 4), target * 4);
    }
  
    // Reescribir de vuelta los píxeles en el bloque
    i = 0;
    for (let y = 0; y < blockSize; y++) {
      for (let x = 0; x < blockSize; x++) {
        const px = startX + x;
        const py = startY + y;
        if (px >= imageData.width || py >= imageData.height) continue;
  
        const idx = (py * width + px) * 4;
        data.set(shifted.slice(i * 4, i * 4 + 4), idx);
        i++;
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
  