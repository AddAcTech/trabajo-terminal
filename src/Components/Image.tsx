import { useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import Download from "./Download";

export type ImageProps = {
  date: string;
  hint: string;
  image: string;
};

function Image(image: ImageProps) {
  const [download, setDownload] = useState(false);

  const handleOpenModal = () => setDownload(true);
  const handleCloseModal = () => setDownload(false);

  return (
    <div className="flex flex-col gap-4 p-4 shadow rounded-xl bg-white">
      {download && <Download onClose={handleCloseModal} />}
      <button className="self-end cursor-pointer" onClick={handleOpenModal}>
        <BsThreeDots />
      </button>
      <div>
        <img src={image.image} className="bg-gray-700 h-32 w-60 rounded-xl" />
      </div>
      <div>
        <p>{image.date}</p>
        <p>{image.hint}</p>
      </div>
    </div>
  );
}

export default Image;
