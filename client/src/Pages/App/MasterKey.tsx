"use client";

import { useState } from "react";
import { useGlobal } from "../../context/GlobalContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function MasterKey() {
  const navigate = useNavigate();
  const { setClaveMaestra } = useGlobal();
  const [inputValue, setInputValue] = useState("");


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setClaveMaestra(inputValue.trim());
    toast.success("Se ha establecido la clave para la sesión");
    navigate("/galery");
  };

  return (
    <div className="flex flex-col justify-center items-center text-black">
      <h1 className="text-3xl mb-6">Establece tu clave global</h1>
      <h3 className="text-1xl mb-6 italic">Vigente durante esta sesión</h3>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Introduce la clave"
          className="bg-neutral-200 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="sessionsButton"
        >
          Guardar
        </button>
      </form>
    </div>
  );
}
