import piexif from "piexifjs";

export async function downloadBlob(
  blob: Blob,
  filename: string,
  format: "jpeg" | "png" | "gif",
  metadata?: Record<string, any> // parametro opcional, para imagenes cifradas por lo general
) {
  // Si es JPEG y hay metadatos, incrustar EXIF
  if (format === "jpeg" && metadata) {
    const ensuredJpeg = await forceBlobToJPEG(blob);
    const jpegAsBinary = await blobToDataURL(ensuredJpeg);
    const jpegWithMetadata = insertMetadata(jpegAsBinary, metadata);
    
    triggerDownload(await dataURLtoBlob(jpegWithMetadata), `${filename}.jpeg`);
    return;
  }

  // Si es JPEG pero SIN metadatos, solo generar la imagen
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

      // Exportar JPEG con calidad 85%
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
    return;
  }

  // Otros formatos
  triggerDownload(blob, `${filename}_descifrado.${format}`);
}

// Función auxiliar: convertir Blob→dataURL
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function forceBlobToJPEG(blob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((jpegBlob) => {
        resolve(jpegBlob!);
        URL.revokeObjectURL(url);
      }, "image/jpeg", 0.85); //Aplicar calidad al 85%
    };

    img.src = url;
  });
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

/* ---------------------------------------------------------
 *  Utilidades base
 * --------------------------------------------------------- */

// Detectar si la cadena es un DataURL válido de JPEG
export function isJpegDataUrl(data: string): boolean {
  return /^data:image\/jpeg;base64,/.test(data);
}

// Convertir base64 (solo payload) a binary string (para piexif)
export function base64ToBinary(base64: string): string {
  return atob(base64);
}

// Convertir ArrayBuffer a binary string
export function bufferToBinary(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return binary;
}
function dataURLtoBlob(dataUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        // 1. Extraer el tipo MIME y los datos codificados
        const parts = dataUrl.split(',');
        if (parts.length < 2) {
            return reject(new Error('Formato de Data URL inválido.'));
        }

        const mimeMatch = parts[0].match(/:(.*?)(;|$)/);
        const mimeType = mimeMatch ? mimeMatch[1] : '';
        const base64Data = parts[1];

        // 2. Decodificar la cadena Base64
        let decodedData: string;
        try {
            // El método atob() está disponible globalmente en entornos de navegador
            decodedData = atob(base64Data);
        } catch (e) {
            return reject(new Error('Error al decodificar la Data URL como Base64.'));
        }

        // 3. Crear un ArrayBuffer y una Uint8Array para el Blob
        const arrayBuffer = new ArrayBuffer(decodedData.length);
        const uint8Array = new Uint8Array(arrayBuffer);

        for (let i = 0; i < decodedData.length; i++) {
            // Obtener el código de carácter de cada byte decodificado
            uint8Array[i] = decodedData.charCodeAt(i);
        }

        // 4. Crear y resolver con el Blob
        const blob = new Blob([uint8Array], { type: mimeType });
        resolve(blob);
    });
}

// Normalizar la entrada asegurando que sea JPEG
// Puede venir de:
// 1. <input type="file">
// 2. dataURL
// 3. binary string
export async function normalizeToJpegBinary(input: File | string): Promise<string> {
  // Caso 1: viene desde <input type="file">
  if (input instanceof File) {
    if (!input.type.includes("jpeg")) {
      throw new Error("El archivo no es un JPEG válido.");
    }
    const buf = await input.arrayBuffer();
    return bufferToBinary(buf);
  }

  // Caso 2: viene como dataURL
  if (isJpegDataUrl(input)) {
    const base64 = input.replace(/^data:image\/jpeg;base64,/, "");
    return base64ToBinary(base64);
  }

  // Caso 3: cadena binaria ya adecuada
  if (typeof input === "string") {
    if (!input.startsWith("data:") && input.length > 0) {
      // Es un binary string que ya debería ser JPEG
      return input;
    }
  }

  throw new Error("Formato de imagen no soportado o no es JPEG.");
}

/* ---------------------------------------------------------
 *  EXIF USERCOMMENT — Codificación estándar
 * --------------------------------------------------------- */
export function encodeUserComment(json: any): string {
  const text = JSON.stringify(json);

  // Requerido por el estándar EXIF
  const prefix = "UNICODE\0"; 

  // Convertir a UTF-16 Big Endian manualmente
  let encoded = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    encoded += String.fromCharCode((code >> 8) & 0xff, code & 0xff);
  }

  return prefix + encoded;
}

export function decodeUserComment(raw: string): any | null {
  if (!raw.startsWith("UNICODE\0")) return "";

  const bytes = raw
    .substring(8)
    .split("")
    .map(ch => ch.charCodeAt(0));

  const decoder = new TextDecoder("utf-16be");
  const text = decoder.decode(new Uint8Array(bytes));

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------
 *  Insertar metadatos EXIF en JPEG
 * --------------------------------------------------------- */

function insertMetadata(jpegBinary: string, metadata: any): string {
  console.log(jpegBinary);
  const exifObj = piexif.load(jpegBinary);

  if (!exifObj.Exif) exifObj.Exif = {};

  exifObj.Exif[piexif.ExifIFD.UserComment] = encodeUserComment(metadata);

  const exifBytes = piexif.dump(exifObj);

  return piexif.insert(exifBytes, jpegBinary);
}

/* ---------------------------------------------------------
 *  Leer metadatos desde un <input type="file">
 * --------------------------------------------------------- */

export async function readMetadataFromFile(file: File) {
  if (!file.type.includes("jpeg")) {
    throw new Error("Solo se pueden leer metadatos EXIF de imágenes JPEG.");
  }

  const buffer = await file.arrayBuffer();
  const binary = bufferToBinary(buffer);

  const exif = piexif.load(binary);
  const raw = exif.Exif?.[piexif.ExifIFD.UserComment];

  return decodeUserComment(raw);
}
