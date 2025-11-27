"use client";

import { useEffect, useRef, useState } from "react";
import { TbZoomIn, TbZoomOut, TbX, TbExternalLink } from "react-icons/tb";

interface ImageInspectorProps {
  src: string;
  onClose: () => void;
}

const MAX_ZOOM = 5;

const ImageInspector: React.FC<ImageInspectorProps> = ({ src, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // -----------------------------------------------------------
  // 🔸 CALCULAR ZOOM MÍNIMO NECESARIO PARA EVITAR BORDES NEGROS
  // -----------------------------------------------------------
  useEffect(() => {
    const updateMinZoom = () => {
      if (!imgRef.current || !containerRef.current) return;

      const img = imgRef.current;
      const container = containerRef.current;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      const zoomX = containerWidth / naturalWidth;
      const zoomY = containerHeight / naturalHeight;

      const newMinZoom = Math.min(zoomX, zoomY);

      setMinZoom(newMinZoom);
      setZoom(newMinZoom);
      setPos({ x: 0, y: 0 });
    };

    updateMinZoom();
    window.addEventListener("resize", updateMinZoom);
    return () => window.removeEventListener("resize", updateMinZoom);
  }, [src]);

  // -----------------------------------------------------------
  // 🔸 ZOOM CON RUEDA DEL MOUSE
  // -----------------------------------------------------------
  const handleWheel = (e: React.WheelEvent) => {
    //e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;

    setZoom((current) => {
      const newZoom = current + direction * 0.15;
      return Math.min(Math.max(newZoom, minZoom), MAX_ZOOM);
    });
  };

  // -----------------------------------------------------------
  // 🔸 ARRASTRAR LA IMAGEN
  // -----------------------------------------------------------
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= minZoom) return;

    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    setPos({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
  }, [isDragging]);

  // -----------------------------------------------------------
  // 🔸 CERRAR CON ESCAPE
  // -----------------------------------------------------------
  useEffect(() => {
    const closeWithEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeWithEsc);
    return () => window.removeEventListener("keydown", closeWithEsc);
  }, []);

  // -----------------------------------------------------------
  // 🔸 CONTROLES MANUALES DE ZOOM
  // -----------------------------------------------------------
  const zoomIn = () => setZoom((z) => Math.min(z + 0.2, MAX_ZOOM));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.2, minZoom));

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

      <div className="relative flex flex-col items-center">

        {/* CERRAR */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 bg-neutral-800 hover:bg-neutral-700 text-white p-2 rounded-full shadow-lg"
        >
          <TbX size={23} />
        </button>

        {/* ABRIR ORIGINAL */}
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute -top-12 left-0 bg-neutral-800 hover:bg-neutral-700 text-white p-2 rounded-full shadow-lg"
        >
          <TbExternalLink size={22} />
        </a>

        {/* CONTENEDOR - NUEVA ALTURA REDUCIDA */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          className="overflow-hidden rounded-lg bg-black shadow-2xl"
          style={{
            maxWidth: "90vw",
            maxHeight: "85vh",   // 🔹 Ajuste de altura para no tapar botones
            cursor: zoom > minZoom ? "grab" : "default",
          }}
        >
          <img
            ref={imgRef}
            src={src}
            draggable={false}
            className="transition-transform duration-150"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
              maxHeight: "80vh",  // 🔹 Imagen más baja para evitar problemas de botones
              maxWidth: "100%",
              objectFit: "contain",
            }}
          />
        </div>

        {/* CONTROLES */}
        <div className="flex gap-4 mt-5">
          <button
            onClick={zoomOut}
            className="bg-neutral-800 hover:bg-neutral-700 text-white p-3 rounded-lg shadow-md"
          >
            <TbZoomOut size={22} />
          </button>

          <button
            onClick={zoomIn}
            className="bg-neutral-800 hover:bg-neutral-700 text-white p-3 rounded-lg shadow-md"
          >
            <TbZoomIn size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageInspector;
