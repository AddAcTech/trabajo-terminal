import React, { useState } from "react";
import Spinner from "./Spinner";

const ImageEncryptor: React.FC<{
  onClose: (imageData?: { image: string; hint: string; date: string }) => void;
}> = ({ onClose }) => {
  // const [password, setPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [modifiedImage, setModifiedImage] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedImage(file);
  };

  const modifyImage = () => {
    if (!selectedImage) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const blockSize = 8;

        for (let blockY = 0; blockY < canvas.height; blockY += blockSize) {
          for (let blockX = 0; blockX < canvas.width; blockX += blockSize) {
            // Generate a random value for this 8x8 block
            const randomValue = Math.floor(Math.random() * 125); // 0-125
            // Como se van a intercambiar
            const channelOrder = Math.floor(Math.random() * 6); // 6 diferentes permutaciones

            // Procesar pixel
            for (let y = 0; y < blockSize && blockY + y < canvas.height; y++) {
              for (let x = 0; x < blockSize && blockX + x < canvas.width; x++) {
                const pixelIndex =
                  ((blockY + y) * canvas.width + (blockX + x)) * 4;

                const r = data[pixelIndex];
                const g = data[pixelIndex + 1];
                const b = data[pixelIndex + 2];

                const rMod = Math.max(r - randomValue, 0);
                const gMod = Math.max(g - randomValue, 0);
                const bMod = Math.max(b - randomValue, 0);

                switch (channelOrder) {
                  case 0: // RGB
                    data[pixelIndex] = rMod;
                    data[pixelIndex + 1] = gMod;
                    data[pixelIndex + 2] = bMod;
                    break;
                  case 1: // RBG
                    data[pixelIndex] = rMod;
                    data[pixelIndex + 1] = bMod;
                    data[pixelIndex + 2] = gMod;
                    break;
                  case 2: // GRB
                    data[pixelIndex] = gMod;
                    data[pixelIndex + 1] = rMod;
                    data[pixelIndex + 2] = bMod;
                    break;
                  case 3: // GBR
                    data[pixelIndex] = gMod;
                    data[pixelIndex + 1] = bMod;
                    data[pixelIndex + 2] = rMod;
                    break;
                  case 4: // BRG
                    data[pixelIndex] = bMod;
                    data[pixelIndex + 1] = rMod;
                    data[pixelIndex + 2] = gMod;
                    break;
                  case 5: // BGR
                    data[pixelIndex] = bMod;
                    data[pixelIndex + 1] = gMod;
                    data[pixelIndex + 2] = rMod;
                    break;
                }
              }
            }
          }
        }
        ctx.putImageData(imageData, 0, 0);
        setModifiedImage(canvas.toDataURL());
      };
    };

    reader.readAsDataURL(selectedImage);
  };

  const dataURLtoBlob = (dataURL: string) => {
    const parts = dataURL.split(";base64,");
    const contentType = parts[0].split(":")[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  };

  const handleUpload = async () => {
    if (modifiedImage) {
      setIsLoading(true);
      const imageBlob = dataURLtoBlob(modifiedImage);
      const imageFile = new File([imageBlob], "modified_image.png", {
        type: "image/png",
      });

      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("description", hint);

      try {
        const response = await fetch("http://localhost:3000/images/upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          console.log("Image uploaded successfully!");
          const today = new Date().toISOString().split("T")[0];
          onClose({ image: modifiedImage, hint, date: today });
        } else {
          console.error("Error uploading image:", response.statusText);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      onClick={() => onClose()}
    >
      <div
        className="bg-white p-7 rounded-xl shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h1 className="text-4xl font-bold mb-6 text-center">
          Modificador de Imagen
        </h1>
        <div className="max-w-sm mx-auto">
          <input
            className="sessionsInput"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <input
            className="sessionsInput mt-2"
            type="text"
            placeholder="Image title"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
          />
          <button className="sessionsButton" onClick={modifyImage}>
            Modificar
          </button>
          <button
            className={`w-full bg-black text-white font-bold p-2 rounded-lg mt-4 ${
              isLoading ? "bg-gray-400 cursor-default" : "cursor-pointer"
            }`}
            onClick={handleUpload}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2 justify-center">
                <span>Subiendo</span> <Spinner />
              </div>
            ) : (
              "Subir"
            )}
          </button>
        </div>

        <div className="flex justify-around mt-6">
          {selectedImage && (
            <div>
              <h2 className="text-2xl font-semibold mb-2">Imagen Original</h2>
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Imagen Original"
                className="max-w-xs max-h-xs border border-gray-300 rounded p-2"
              />
            </div>
          )}
          {modifiedImage && (
            <div>
              <h2 className="text-2xl font-semibold mb-2">Imagen Modificada</h2>
              <img
                src={modifiedImage}
                alt="Imagen Modificada"
                className="max-w-xs max-h-xs border border-gray-300 rounded p-2"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEncryptor;
