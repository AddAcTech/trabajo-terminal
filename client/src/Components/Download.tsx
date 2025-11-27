import React, { useState } from "react";
import { decryptImage } from "../lib/cifrado";
import { downloadBlob } from "../lib/download_utils";
import ImageInspector from "./ImageInspector";

type DownloadProps = {
  onClose: () => void;
  hint: string;
  src: string;
  blockSize: number;
  extraCols: number;
  extraRows: number;
  claveMaestra : string | null;
};

const Download: React.FC<DownloadProps> = ({
  onClose,
  hint,
  src,
 
  blockSize,
  extraCols,
  extraRows, claveMaestra,
}) => {
  //const [password, setPassword] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedSrc, setDecryptedSrc] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<"jpeg" | "png" | "gif">("jpeg");

  const [verImagenCifrada, setVerImagenCifrada] = useState(false);
  const [verImagenDescifrada, setVerImagenDescifrada] = useState(false);

  if(!claveMaestra){
    return 
  }

  const handleDecrypt = async () => {
    setIsDecrypting(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;

      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const { image: decryptedImage } = await decryptImage(
          imageData,
          blockSize,
          claveMaestra,
          extraRows,
          extraCols
        );

        const outputCanvas = document.createElement("canvas");
        outputCanvas.width = decryptedImage.width;
        outputCanvas.height = decryptedImage.height;
        const outputCtx = outputCanvas.getContext("2d");
        if (!outputCtx) return;

        outputCtx.putImageData(decryptedImage, 0, 0);
        setDecryptedSrc(outputCanvas.toDataURL(`image/${downloadFormat}`));
        setIsDecrypting(false);
      };
    } catch (error) {
      console.error("Error al descifrar:", error);
      setIsDecrypting(false);
    }
  };

  const handleDownload = () => {
    if (!decryptedSrc) return;

    fetch(decryptedSrc)
      .then((res) => res.blob())
      .then((blob) => {
        downloadBlob(blob, hint, downloadFormat);
      });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
       
        className="bg-white p-4 rounded-xl shadow-lg max-h-[90vh] overflow-y-auto w-11/12 max-w-md"
       
        onClick={(e) => e.stopPropagation()}
      
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          {hint}
        </h2>

        {/* Imagen cifrada */}
        <img
          src={src}
          loading="lazy"
          className="bg-gray-700 h-36 w-70 rounded-xl mb-4 object-cover mx-auto"
          onClick={() => setVerImagenCifrada(true)}
        />
        {verImagenCifrada && <ImageInspector src={src} onClose={() => setVerImagenCifrada(false)} />}
      
        {/* Botón para descifrar */}
        <button
          onClick={handleDecrypt}
          disabled={isDecrypting}
          className="sessionsButton mb-4 disabled:opacity-50"
        >
          {isDecrypting ? "Descifrando..." : "Descifrar imagen"}
        </button>

        {/* Vista previa imagen descifrada */}
        {decryptedSrc && (
          <>
            <h3 className="font-semibold mb-2">Vista previa:</h3>
            <img
              src={decryptedSrc}
              className="bg-gray-200 h-36 w-70 rounded-xl mb-4 object-cover mx-auto"
              onClick={() => setVerImagenDescifrada(true)}
            />

            {verImagenDescifrada && <ImageInspector src={decryptedSrc} onClose={() => setVerImagenDescifrada(false)} />}

            {/* Selección de formato */}
            <div className="flex justify-between">
              <label className="block font-semibold mb-1">Formato de descarga:</label>
              <select
                value={downloadFormat}
                onChange={(e) => setDownloadFormat(e.target.value as "jpeg" | "png" | "gif")}
                className="border rounded px-2 py-1 mb-3 w-full min-w-fit"
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="gif">GIF</option>
              </select>
            </div>
            {/* Botón de descarga */}
            <button
              onClick={handleDownload}
              className="sessionsButton"
            >
              Descargar imagen descifrada
            </button>
          </>
        )}
      </div>
      
    </div>
  );
};

export default Download;
