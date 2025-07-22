import { useEffect, useState } from "react";
import { ImageProps } from "../../Components/Image";
import Image from "../../Components/Image";
import ImageEncryptor from "../../Components/ImageEncryptor";
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
    extraCols: number;
    extraRows: number;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [myImages, setMyImages] = useState<ImageProps[]>([]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = (imageData?: {
    image: string;
    hint: string;
    date: string;
    extraCols: number;
    extraRows: number;

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
        const images: ImageProps[] = data.map((image: Image) => ({
          date: image.createdAt,
          hint: image.title,
          image: image.url,
          extraCols: image.extraCols,
          extraRows: image.extraRows
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
      <button
        className="bg-neutral-800 text-white py-2 px-4 mb-2 rounded-lg hover:bg-neutral-950 mt-4"
        onClick={handleOpenModal}
      >
        Subir nueva imagen
      </button>
      <div className="flex flex-wrap justify-between gap-4">
        {myImages.map((image, index) => (
          <Image key={index} {...image} />
        ))}
      </div>
      {isModalOpen && <ImageEncryptor onClose={handleCloseModal} />}
    </div>
  );
}

export default Galery;
