import React, { useState } from "react";

const ImageEncryptor: React.FC = () => {
  const [password, setPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [encryptedImage, setEncryptedImage] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedImage(file);
  };

  const encryptImage = async () => {
    if (!selectedImage || !password) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageBase64 = reader.result?.toString() || "";

      // Aquí puedes añadir tu lógica de cifrado de imagen con la contraseña.
      // Este es solo un ejemplo de cómo podrías hacerlo usando una función de cifrado simple.
      const encryptedData = btoa(imageBase64 + password);
      setEncryptedImage(encryptedData);
    };

    reader.readAsDataURL(selectedImage);
  };

  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-4xl font-bold mb-6">Encriptador de Imagen</h1>
      <input
        className="block mx-auto mb-4 p-2 border rounded"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
      />
      <input
        className="block mx-auto mb-4 p-2 border rounded"
        type="password"
        placeholder="Introduce la contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700"
        onClick={encryptImage}
      >
        Cifrar
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
        {encryptedImage && (
          <div>
            <h2 className="text-2xl font-semibold mb-2">Imagen Encriptada</h2>
            <img
              src={`data:image/png;base64,${encryptedImage}`}
              alt="Imagen Encriptada"
              className="max-w-xs max-h-xs border border-gray-300 rounded p-2"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEncryptor;
