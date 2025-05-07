import { encryptImage, decryptImage } from './cifrado.js';

document.getElementById("imageForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const imageInput = document.getElementById("imageInput").files[0];
  const blockSize = parseInt(document.getElementById("blockSize").value, 10);
  const password = document.getElementById("password").value;
  const reverseMode = document.getElementById("reverseMode").checked;
  const applyNoise = document.getElementById("applyNoise").checked;

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const output = document.getElementById("output");

  if (!imageInput || !blockSize || !password) {
    alert("Todos los campos son requeridos.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = async function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      let imageData = ctx.getImageData(0, 0, img.width, img.height);

      try {
        let result;
        if (reverseMode) {
          // Extra rows/cols deben venir desde metadatos guardados anteriormente
          const extraCols = parseInt(document.getElementById("extraCols").value, 10) || 0;
          const extraRows = parseInt(document.getElementById("extraRows").value, 10) || 0;
          result = await decryptImage(imageData, blockSize, password, extraRows, extraCols, applyNoise);
        } else {
          result = await encryptImage(imageData, blockSize, password, applyNoise);
          // Llenamos campos para luego descifrar si se desea
          document.getElementById("extraCols").value = result.extraCols;
          document.getElementById("extraRows").value = result.extraRows;
        }

        canvas.width = result.image.width;
        canvas.height = result.image.height;
        ctx.putImageData(result.image, 0, 0);

        output.innerHTML = `
          <strong>${reverseMode ? "Descifrado" : "Cifrado"} completado.</strong><br>
          Tiempo: ${result.time} segundos<br>
          Dimensiones: ${result.image.width} x ${result.image.height}<br>
          Filas extra: ${reverseMode ? "-" : result.extraRows}, 
          Columnas extra: ${reverseMode ? "-" : result.extraCols}
        `;

        document.getElementById("downloadBtn").style.display = "inline-block";
        document.getElementById("downloadBtn").onclick = () => {
          const link = document.createElement("a");
          link.download = reverseMode ? "imagen_descifrada.png" : "imagen_cifrada.png";
          link.href = canvas.toDataURL("image/png");
          link.click();
        };

        document.getElementById("downloadJpgBtn").style.display = "inline-block";
        document.getElementById("downloadJpgBtn").onclick = () => {
          const link = document.createElement("a");
          link.download = reverseMode ? "imagen_descifrada.jpg" : "imagen_cifrada.jpg";
          link.href = canvas.toDataURL("image/jpeg", 0.95);
          link.click();
        };

      } catch (err) {
        alert("Error al procesar la imagen: " + err.message);
      }
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(imageInput);
});
