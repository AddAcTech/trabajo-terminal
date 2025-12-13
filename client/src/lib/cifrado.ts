export async function encryptImage(imageData: ImageData, blockSize: number, password: string) {
    //console.log("Block Size:", blockSize);
    //console.log("ImageData:", imageData);
    //console.log("Width x Height:", imageData.width, imageData.height);
    const t0 = performance.now();
  
    const { imageData: paddedImageData, extraCols, extraRows } = padImageData(imageData, blockSize);
    const { width, height } = paddedImageData;
    const widthInBlocks = Math.ceil(width / blockSize);
    const heightInBlocks = Math.ceil(height / blockSize);
    const totalBlocks = widthInBlocks * heightInBlocks;
    //console.log(totalBlocks)
    const hashArray = await hashPassword(password);
    //console.log(hashArray)
    const shiftPRNG = await createSecurePRNG(hashArray, 0);
    const channelPRNG = await createSecurePRNG(hashArray, totalBlocks );
    const negPRNG = await createSecurePRNG(hashArray, totalBlocks * 2);
    ////console.log("BloquesX:", blocksX, "BloquesY:", blocksY, "Total:", totalBlocks);
    const seed64 = hashArray.slice(0, 8).reduce((acc, val, i) => acc + (val << (i * 8)), 0);
    const permutation = generatePermutationWithPI(totalBlocks, seed64);
    //const permutation = generateDeterministicPermutation(totalBlocks, blockPRNG);
    ////console.log("Existe la permutación")
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
  
    const t1 = performance.now();
    return {
      image: resultImage,
      extraRows: extraRows,
      extraCols: extraCols,
      time: ((t1 - t0) / 1000).toFixed(2)
    };
  }
  
export async function decryptImage(imageData: { width: any; height: any; data?: any; }, blockSize: number, password: any, extraRows: number, extraCols: number) {
    //console.log("Block Size:", blockSize);
    //console.log("ImageData:", imageData);
    //console.log("Width x Height:", imageData.width, imageData.height);
    const t0 = performance.now();
  
    const { width, height } = imageData;
    const widthInBlocks = Math.ceil(width / blockSize);
    const heightInBlocks = Math.ceil(height / blockSize);
    const totalBlocks = widthInBlocks * heightInBlocks;
  
    const hashArray = await hashPassword(password);
  
    const shiftPRNG = await createSecurePRNG(hashArray, 0);
    const channelPRNG = await createSecurePRNG(hashArray, totalBlocks );
    const negPRNG = await createSecurePRNG(hashArray, totalBlocks * 2);
    ////console.log("BloquesX:", blocksX, "BloquesY:", blocksY, "Total:", totalBlocks);
    //const permutation = generateDeterministicPermutation(totalBlocks, blockPRNG);
    const seed64 = hashArray.slice(0, 8).reduce((acc, val, i) => acc + (val << (i * 8)), 0);
    const permutation = generatePermutationWithPI(totalBlocks, seed64);

    const invertedPermutation = invertPermutation(permutation);
  
    if (!Number.isFinite(width) || !Number.isFinite(height)) throw new Error("Dimensiones inválidas");
    let resultImage = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
  

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


  async function hashPassword(password: string | undefined) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }

  function padImageData(imageData: { width: any; height: any; data: any; }, blockSize: number) {
    const { width, height, data } = imageData;
    const extraCols = (blockSize - (width % blockSize)) % blockSize;
    const extraRows = (blockSize - (height % blockSize)) % blockSize;
    const newWidth = width + extraCols;
    const newHeight = height + extraRows;
  
    if (!Number.isFinite(blockSize) || blockSize <= 0) throw new Error("blockSize inválido");
    if (!Number.isFinite(width) || !Number.isFinite(height)) throw new Error("Dimensiones inválidas");
    const paddedData = new Uint8ClampedArray(newWidth * newHeight * 4);
    paddedData.fill(255);
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

async function createSecurePRNG(seedBytes: Uint8Array, offset = 0) {
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
  
  function invertPermutation(permutation: any[]) {
    const inverse: any[] = [];
    permutation.forEach((val:  number, i: any) => {
      inverse[val] = i;
    });
    return inverse;
  }
  
  /**
   * Aplica una permutación a bloques MxM dentro de una imagen.
   * Complejidad temporal: O(n * M^2) donde n = bloques totales
   * Complejidad espacial: O(pixels) -> tamaño total de la imagen
   */
  function permuteBlocks(imageData: ImageData, blockSize: number, permutation: string | any[]) {
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
  function shiftBlock(imageData: ImageData, blockSize: number, startX: number, startY: number, shiftAmount: number) {
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
  async function permuteChannels(imageData: ImageData, blockSize: number, prng: { (): Promise<number>; (): Promise<number>; (): any; }, reverse: boolean) {
    //console.log("Ejecutando permutación de canales...");
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
    //console.log("Acabé de permutar");
    return new ImageData(data, width, height);
  }

/**
 * Aplica transformación negativa-positiva por bloque completo.
 * Cada bloque se invierte completamente o se deja igual.
 * @param {ImageData} imageData
 * @param {number} blockSize
 * @param {function} prng - Generador asíncrono que retorna float entre 0 y 1
 */
async function applyBlockLevelNegativeTransform(imageData: ImageData, blockSize: number, prng: { (): Promise<number>; (): Promise<number>; (): any; }) {
  //console.log("transformando...")
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
  //console.log("Acabé de transformar")
  return new ImageData(data, imageData.width, imageData.height);
}

  
function cropImageData(imageData: ImageData, targetWidth: number, targetHeight: number) {
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
  
function generatePermutationWithPI(n: number, seed64: number) {
    const PI = Math.PI;
    const A = [];
    // Paso 1: multiplicar el número aleatorio por PI varias veces
    for (let i = 0; i < n; i++) {
      const mixed = (seed64 + i) * PI;
      const fractional = mixed - Math.floor(mixed); // parte decimal
      A.push(fractional);
    }
    // Paso 2: ajutar los coeficientes de fracciones a un entero
    const coefficients = A.map(a => Math.floor(a * 1e12) );
    // Paso 3: aplicar los coeficientes al arreglo base [0..n-1] usando Fisher-Yates
    const perm = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = coefficients[i] % (i + 1);
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    return perm;
  }