export function downloadBlob(blob: Blob, filename: string, format: "jpeg" | "png" | "gif") {
  // Crear un canvas temporal si es imagen para ajustar compresión en JPEG
  if (format === "jpeg" && blob.type.startsWith("image/")) {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      // Exportar como JPEG con 85% de calidad
      canvas.toBlob(
        (jpegBlob) => {
          if (jpegBlob) {
            triggerDownload(jpegBlob, `${filename}_descifrado.jpeg`);
          }
          URL.revokeObjectURL(url);
        },
        "image/jpeg",
        0.85
      );
    };
    img.src = url;
  } else {
    // Otros formatos sin compresión especial
    triggerDownload(blob, `${filename}_descifrado.${format}`);
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
