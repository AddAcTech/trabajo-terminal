import { useState } from "react";
import { ImageProps } from "../../Components/Image";
import Image from "../../Components/Image";
import ImageEncryptor from "../../Components/Si";

function Galery() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [myImages, setMyImages] = useState<ImageProps[]>([
    {
      date: "2021-09-01",
      hint: "A beautiful image",
      image:
        "https://th.bing.com/th/id/OIP.RT8SnHHM41mQkBpkuNHjqAHaEK?rs=1&pid=ImgDetMain",
    },
  ]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = (imageData?: {
    image: string;
    hint: string;
    date: string;
  }) => {
    setIsModalOpen(false);
    if (imageData) {
      setMyImages([...myImages, imageData]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-center">
        {myImages.map((image, index) => (
          <Image key={index} {...image} />
        ))}
      </div>
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 mt-4"
        onClick={handleOpenModal}
      >
        Subir nueva imagen
      </button>
      {isModalOpen && <ImageEncryptor onClose={handleCloseModal} />}
    </div>
  );
}

export default Galery;
