import { ImageProps } from "../../Components/Image";
import Image from "../../Components/Image"; // Ensure correct import

function Galery() {
  const myImages: ImageProps[] = [
    {
      date: "2021-09-01",
      hint: "A beautiful image",
      image:
        "https://th.bing.com/th/id/OIP.RT8SnHHM41mQkBpkuNHjqAHaEK?rs=1&pid=ImgDetMain",
    },
    {
      date: "2021-09-01",
      hint: "A beautiful image",
      image:
        "https://th.bing.com/th/id/OIP.RT8SnHHM41mQkBpkuNHjqAHaEK?rs=1&pid=ImgDetMain",
    },
    {
      date: "2021-09-01",
      hint: "A beautiful image",
      image:
        "https://th.bing.com/th/id/OIP.RT8SnHHM41mQkBpkuNHjqAHaEK?rs=1&pid=ImgDetMain",
    },
    {
      date: "2021-09-01",
      hint: "A beautiful image",
      image:
        "https://th.bing.com/th/id/OIP.RT8SnHHM41mQkBpkuNHjqAHaEK?rs=1&pid=ImgDetMain",
    },
    {
      date: "2021-09-01",
      hint: "A beautiful image",
      image:
        "https://th.bing.com/th/id/OIP.RT8SnHHM41mQkBpkuNHjqAHaEK?rs=1&pid=ImgDetMain",
    },
    {
      date: "2021-09-01",
      hint: "A beautiful image",
      image:
        "https://th.bing.com/th/id/OIP.RT8SnHHM41mQkBpkuNHjqAHaEK?rs=1&pid=ImgDetMain",
    },
  ];
  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-center">
        {myImages.map((image, index) => (
          <Image key={index} {...image} />
        ))}
      </div>
    </div>
  );
}

export default Galery;
