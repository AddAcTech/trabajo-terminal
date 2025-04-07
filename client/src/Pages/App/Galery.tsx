import { useEffect, useState } from "react";
import { ImageProps } from "../../Components/Image";
import Image from "../../Components/Image";
import ImageEncryptor from "../../Components/Si";
import { toast } from "react-toastify";

function Galery() {
  type Image = {
    createdAt: string;
    id: number;
    publicId: string;
    title: string;
    updatedAt: string;
    url: string;
    userId: number;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [myImages, setMyImages] = useState<ImageProps[]>([]);

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

  useEffect(() => {
    try {
      const getImages = async () => {
        const response = await fetch("http://localhost:3000/images/images", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        console.log(data);
        const images: ImageProps[] = data.map((image: Image) => ({
          date: image.createdAt,
          hint: image.title,
          image: image.url,
        }));
        setMyImages(images);
      };
      getImages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    }
  }, []);

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
