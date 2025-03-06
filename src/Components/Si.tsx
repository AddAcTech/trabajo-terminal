import React, { useState } from "react";

const ImageEncryptor: React.FC<{
  onClose: (imageData?: { image: string; hint: string; date: string }) => void;
}> = ({ onClose }) => {
  const [password, setPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [modifiedImage, setModifiedImage] = useState<string | null>(null);
  const [hint, setHint] = useState("");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedImage(file);
  };

  const modifyImage = async () => {
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

        for (let i = 0; i < data.length; i += 4) {
          //   data[i] = Math.max(data[i] - 70, 0);
          data[i] = Math.max(255 - data[i], 0); // R
          data[i + 1] = Math.max(255 - data[i + 1], 0); // G
          data[i + 2] = Math.max(255 - data[i + 2], 0); // B
        }

        ctx.putImageData(imageData, 0, 0);
        setModifiedImage(canvas.toDataURL());
      };
    };

    reader.readAsDataURL(selectedImage);
  };

  const handleUpload = () => {
    if (modifiedImage) {
      const today = new Date().toISOString().split("T")[0];
      onClose({ image: modifiedImage, hint, date: today });
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      onClick={() => onClose()}
    >
      <div
        className="bg-white p-4 rounded-xl shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h1 className="text-4xl font-bold mb-6">Modificador de Imagen</h1>
        <input
          className="block mx-auto mb-4 p-2 border rounded"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <input
          className="block mx-auto mb-4 p-2 border rounded"
          type="text"
          placeholder="Escribe una pista"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
        />
        <button
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700"
          onClick={modifyImage}
        >
          Modificar
        </button>
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 mt-4"
          onClick={handleUpload}
        >
          Subir
        </button>
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
