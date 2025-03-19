import { JSX, useState } from "react";

type TooltipProps = {
  children: JSX.Element;
  text: string;
};

function Tooltip({ children, text }: TooltipProps) {
  const [show, setShow] = useState(false);
  const showTooltip = () => {
    setShow(true);
  };
  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={() => setShow(false)}
    >
      <div
        className={`transition-opacity duration-300 ease-in-out ${
          show ? "opacity-100" : "opacity-0"
        } text-xs absolute bottom-full left-1/2 transform bg-amber-100 text-black text-center rounded px-2 py-1 z-10 whitespace-nowrap`}
      >
        {text}
      </div>
      {children}
    </div>
  );
}

export default Tooltip;
