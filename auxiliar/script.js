let lastImageData = null;

document.getElementById("imageForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const imageInput = document.getElementById("imageInput").files[0];
  const blockSize = parseInt(document.getElementById("blockSize").value, 10);
  const password = document.getElementById("password").value;
  const reverseMode = document.getElementById("reverseMode").checked;

  if (!blockSize || !password) {
    alert("Todos los campos son requeridos.");
    return;
  }

  if (reverseMode && !lastImageData && !imageInput) {
    alert("Debe subir una imagen para descifrar.");
    return;
  }

  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  const hashArray = new Uint8Array(hashBuffer);

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  if (reverseMode && lastImageData) {
    process(new ImageData(new Uint8ClampedArray(lastImageData.data), lastImageData.width, lastImageData.height));
  } else if (reverseMode && imageInput) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        process(imageData);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(imageInput);
  } else {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        let width = img.width;
        let height = img.height;

        const extraCols = (blockSize - (width % blockSize)) % blockSize;
        const extraRows = (blockSize - (height % blockSize)) % blockSize;

        const paddedWidth = width + extraCols;
        const paddedHeight = height + extraRows;

        canvas.width = paddedWidth;
        canvas.height = paddedHeight;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, paddedWidth, paddedHeight);
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, paddedWidth, paddedHeight);
        process(imageData);

        document.getElementById("output").innerHTML +=
          ` Se añadieron ${extraRows} filas y ${extraCols} columnas.`;
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(imageInput);
  }

  async function process(imageData) {
    const t0 = performance.now();
  
    const { width, height } = imageData;
    const widthInBlocks = Math.ceil(width / blockSize);
    const heightInBlocks = Math.ceil(height / blockSize);
    const totalBlocks = widthInBlocks * heightInBlocks;
  
    const blockPRNG = createHashPRNG(hashArray, 0);
    const shiftPRNG = createHashPRNG(hashArray, totalBlocks);
    const channelPRNG = createHashPRNG(hashArray, totalBlocks * 2);
    const negPRNG = createHashPRNG(hashArray, totalBlocks * 3);

    const applyNoise =  false;
    const noisePRNG = createHashPRNG(hashArray, totalBlocks * 4); // nuevo offset

  

    const basePermutation = generateDeterministicPermutation(totalBlocks, blockPRNG);
    //const shiftAmount = Math.floor(totalBlocks / password.length);
    //const rotatedPermutation = rotatePermutation(basePermutation, shiftAmount, 'right');
  
    let resultImage = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
  
    if (!reverseMode) {
      // CIFRADO
  
      // 1. Permutar bloques
      resultImage = permuteBlocks(resultImage, blockSize, basePermutation);
  
      // 2. Desplazar cada bloque
      for (let by = 0; by < heightInBlocks; by++) {
        for (let bx = 0; bx < widthInBlocks; bx++) {
          const startX = bx * blockSize;
          const startY = by * blockSize;
          const blockShift = shiftPRNG() % (blockSize * blockSize);
          const inverseShift = (blockSize * blockSize - blockShift) % (blockSize * blockSize);
          shiftBlock(resultImage, blockSize, startX, startY, inverseShift);
        }
      }
  
      // 3. Permutar canales
      permuteChannels(resultImage, blockSize, channelPRNG, false);
  
      // 4. Aplicar transformación negativa-positiva
      applyNegativeTransform(resultImage, negPRNG);

      //5. Aplicar ruido, si fue habilitado
      if (applyNoise) {
        resultImage = applyNoiseXOR(resultImage, noisePRNG);
      }
  
    } else {
      // DESCIFRADO

      //0. Revertir ruido si está presente
      if (applyNoise) {
        resultImage = applyNoiseXOR(resultImage, noisePRNG);
      }      
  
      // 1. Revertir transformación negativa-positiva
      resultImage = applyNegativeTransform(resultImage, negPRNG);
  
      // 2. Revertir permutación de canales
      permuteChannels(resultImage, blockSize, channelPRNG, true);
  
      // 3. Revertir desplazamiento circular en bloques
      for (let by = 0; by < heightInBlocks; by++) {
        for (let bx = 0; bx < widthInBlocks; bx++) {
          const startX = bx * blockSize;
          const startY = by * blockSize;
          const blockShift = shiftPRNG() % (blockSize * blockSize);
          shiftBlock(resultImage, blockSize, startX, startY, (blockSize - blockShift) % blockSize);
        }
      }
  
      // 4. Revertir permutación de bloques
      const invertedPermutation = invertPermutation(basePermutation);
      resultImage = permuteBlocks(resultImage, blockSize, invertedPermutation);
      
    }
  
    // Finalizar
    canvas.style.display = "block";
    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(resultImage, 0, 0);
  
    lastImageData = new ImageData(new Uint8ClampedArray(resultImage.data), width, height);
  
    const t1 = performance.now();
    const duration = ((t1 - t0) / 1000).toFixed(2);
  
    document.getElementById("output").innerHTML = `Proceso ${reverseMode ? "de descifrado" : "de cifrado"} completado.<br>
    Tiempo: ${duration} segundos<br>
    Bloques: ${totalBlocks}`;
  
    document.getElementById("downloadBtn").style.display = "inline-block";
    document.getElementById("downloadBtn").onclick = () => {
      const link = document.createElement('a');
      link.download = reverseMode ? "imagen_descifrada.png" : "imagen_cifrada.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
  
    document.getElementById("downloadJpgBtn").style.display = "inline-block";
    document.getElementById("downloadJpgBtn").onclick = () => {
      const link = document.createElement('a');
      link.download = reverseMode ? "imagen_descifrada.jpg" : "imagen_cifrada.jpg";
      link.href = canvas.toDataURL("image/jpeg", 1.0);
      link.click();
    };
  }
  
});

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

