import React, { useState } from "react";
import { encryptImage } from "../lib/cifrado";
import { downloadBlob } from "../lib/download_utils";
import { LuDownload, LuLock, LuUpload, LuX } from "react-icons/lu";
const ImageEncryptor: React.FC<{
  onClose: (imageData?: {
    image: string;
    hint: string;
    date: string;
    extraCols: number;
    extraRows: number;
    blockSize : number;
  }) => void;
  claveMaestra: string | null;
}> = ({ onClose, claveMaestra }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [modifiedImage, setModifiedImage] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [extraRows, setExtraRows] = useState(0);
  const [extraCols, setExtraCols] = useState(0);
  const [blockSize ] = useState(8);
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedImage(file);
  };

  if (!claveMaestra) {
    return;
  }
  const claveVerificada: string = claveMaestra;

  const modifyImage = async () => {
    if (!selectedImage) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;

      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
          const {
            image: encryptedImage,
            extraRows: filasExtra,
            extraCols: columnasExtra,
          } = await encryptImage(imageData, blockSize, claveVerificada);

          const outputCanvas = document.createElement("canvas");
          outputCanvas.width = encryptedImage.width;
          outputCanvas.height = encryptedImage.height;
          const outputCtx = outputCanvas.getContext("2d");
          if (!outputCtx) return;
          outputCtx.putImageData(encryptedImage, 0, 0);

          setModifiedImage(outputCanvas.toDataURL());
          setExtraCols(columnasExtra);
          setExtraRows(filasExtra);
        } catch (error) {
          console.error("Error al cifrar la imagen:", error);
        }
      };
    };

    reader.readAsDataURL(selectedImage);
  };

  function imageToJpegBlob(imageSrc: string, quality = 0.85): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No se pudo obtener el contexto");

        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject("Error al generar JPEG");
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => reject("No se pudo cargar la imagen");
    });
  }

  function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const downloadJPEG = async () => {
    if (!modifiedImage) return;
    setIsLoading(true);
    try {
      const blob = await fetch(modifiedImage).then((r) => r.blob());

      await downloadBlob(blob, `${hint}_cifrada`, "jpeg", {
        extraCols,
        extraRows,
        blockSize,
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error al descargar:", error);
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (modifiedImage) {
      setIsLoading(true);

      try {
        const blob = await imageToJpegBlob(modifiedImage, 0.85);
        const imageFile = new File([blob], "modified_image.jpg", {
          type: "image/jpeg",
        });

        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("description", hint);
        //después, vamos a necesitar este dato de columnas y filas que se añaden
        formData.append("extraCols", String(extraCols || 0));
        formData.append("extraRows", String(extraRows || 0));
        formData.append("blockSize", String(blockSize));
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/images/upload`,
          {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          console.log("Imagen subida correctamente");
          const today = new Date().toISOString().split("T")[0];
          const base64JPEG = await blobToDataURL(blob);
          onClose({
            image: base64JPEG,
            hint,
            date: today,
            extraCols: extraCols,
            extraRows: extraRows,
            blockSize: blockSize,
          });
        } else {
          console.error(
            "Ha ocurrido un erro al subir la imagen:",
            response.statusText
          );
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error uploading image:", error);
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-50"
      onClick={() => onClose()}
    >
      <div
        className="bg-neutral-900 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-neutral-800 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-50">
            Subir una imagen
          </h1>
          <button
            onClick={() => onClose()}
            className="text-neutral-400 hover:text-neutral-50 transition-colors"
          >
            <LuX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/50 transition-all"
              />
              <LuUpload className="absolute right-3 top-3.5 w-5 h-5 text-neutral-500 pointer-events-none" />
            </div>

            <input
              type="text"
              placeholder="Alias de la imagen"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600/50 transition-all"
            />

            <button
              onClick={modifyImage}
              disabled={!selectedImage}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 text-neutral-50 rounded-lg hover:bg-neutral-700 hover:border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium"
            >
              <LuLock className="w-4 h-4" />
              Aplicar cifrado
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {selectedImage && (
              <div className="flex flex-col items-center space-y-3">
                <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
                  Imagen Original
                </h2>
                <img
                  src={URL.createObjectURL(selectedImage) || "/placeholder.svg"}
                  alt="Imagen Original"
                  className="w-full max-w-xs aspect-square object-cover border border-neutral-700 rounded-lg"
                />
              </div>
            )}
            {modifiedImage && (
              <div className="flex flex-col items-center space-y-3">
                <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
                  Imagen Cifrada
                </h2>
                <img
                  src={modifiedImage || "/placeholder.svg"}
                  alt="Imagen Cifrada"
                  className="w-full max-w-xs aspect-square object-cover border border-neutral-700 rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {modifiedImage && (
              <button
                onClick={downloadJPEG}
                className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 text-neutral-50 rounded-lg hover:bg-neutral-700 hover:border-neutral-600 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <LuDownload className="w-4 h-4" />
                Descargar imagan cifrada como JPEG
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={!selectedImage || !modifiedImage || isLoading}
              className="flex-1 px-4 py-3 bg-violet-600 text-neutral-50 rounded-lg hover:bg-violet-700 disabled:bg-neutral-700 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-50/30 border-t-neutral-50 rounded-full animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <LuUpload className="w-4 h-4" />
                  Subir
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEncryptor;
