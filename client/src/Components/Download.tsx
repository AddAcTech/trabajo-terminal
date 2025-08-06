import React, { useState } from "react";
import { decryptImage } from "./cifrado";

type DownloadProps = {
  onClose: () => void;
  src: string;
  hint: string;
  password: string;
  blockSize: number;
  extraCols: number;
  extraRows: number;
};

const Download: React.FC<DownloadProps> = ({
  onClose,
  hint,
  src,
  password,
  blockSize,
  extraCols,
  extraRows,
}) => {
  const [isDecrypting, setIsDecrypting] = useState(false);

  // const handleDownloadCifrada = async () => {
  //   //TODO descarga de la imágen cifrada
  // };

  const handleDownloadDescifrada = async () => {
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
          password,
          extraRows,
          extraCols
        );

        const outputCanvas = document.createElement("canvas");
        outputCanvas.width = decryptedImage.width;
        outputCanvas.height = decryptedImage.height;
        const outputCtx = outputCanvas.getContext("2d");
        if (!outputCtx) return;

        outputCtx.putImageData(decryptedImage, 0, 0);
        const link = document.createElement("a");
        link.download = "imagen_descifrada_" + hint + ".jpeg"; //sustituir por la notación ´someting${var}´, pero no me sale de momento
        link.href = outputCanvas.toDataURL("image/jpeg", 0.85); //"image/jpeg",0.85
        link.click();

        setIsDecrypting(false);
      };
    } catch (error) {
      console.error("Error al descifrar:", error);
      setIsDecrypting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded-xl shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">
          Descifrar y descargar la imagen
        </h2>

        <img
          src={src}
          loading="lazy"
          className="bg-gray-700 h-32 w-60 rounded-xl mb-4"
        />

        <div className="flex flex-col gap-2">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            onClick={handleDownloadDescifrada}
            disabled={isDecrypting}
          >
            {isDecrypting ? "Descifrando..." : "Descargar imagen descifrada"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Download;
