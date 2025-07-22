import { useState } from "react";
import { BsDownload } from "react-icons/bs";
import Download from "./Download";

export type ImageProps = {
  date: string;
  hint: string;
  image: string;
  extraCols : number;
  extraRows: number;
};

const password = "p455w0rd-PL4C3H0LD3R";
const blockSize = 8;

function Image(image: ImageProps) {
  const [download, setDownload] = useState(false);

  const handleOpenModal = () => setDownload(true);
  const handleCloseModal = () => setDownload(false);
  //TODO obtener las columnas extras de la base de datos y añadirlas a los parametros
  return (
    <div className="flex flex-col gap-4 p-4 shadow rounded-xl bg-white mx-auto">
      {download && <Download
                    onClose={handleCloseModal}
                    hint = {image.hint}
                    src={image.image}
                    password={password}
                    blockSize={blockSize}
                    extraCols={image.extraCols}
                    extraRows={image.extraRows}
                  />}
      <button className="self-end cursor-pointer" onClick={handleOpenModal}>
        <BsDownload />
      </button>
      <div>
        <img
          src={image.image}
          loading="lazy"
          className="bg-gray-700 h-32 w-60 rounded-xl"
        />
      </div>
      <div>
        <p>{image.date}</p>
        <p>{image.hint}</p>
      </div>
    </div>
  );
}

export default Image;
