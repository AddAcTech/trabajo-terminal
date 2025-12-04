"use client";

import { useState, useEffect } from "react";
import { useGlobal } from "../../context/GlobalContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function MasterKey() {
  const navigate = useNavigate();
  const { setClaveMaestra } = useGlobal();
  const [inputValue, setInputValue] = useState<string>("");
  const [hasAKey, setHasAKey] = useState<boolean>(false);
  const [idUser, setIdUser] = useState<number>();

  useEffect(() => {
    const id_user = sessionStorage.getItem("id");
    if (id_user == null) {
      toast.error("No se encuentra la sesión, incie sesión de nuevo");
      navigate("/login");
    } else {
      //un else redundante, pero así el tipado me deja continuar
      setIdUser(parseInt(id_user));
    }
  }, []);

  useEffect(() => {
    if (idUser == 0)
      //que se ejecute cuando ya se tenga un valor
      return;
    try {
      const keyExits = async () => {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/users/verify-key`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              id_user: idUser,
            }),
          }
        );
        const data = await response.json();
        setHasAKey(data.poseeClaveMaestra); //indica si tiene una clave maestra, de no existir, se debe de asignar; de no existir, se tiene que verificar que se ingrese lo mismo
      };
      keyExits();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido");
    }
  }, [idUser]);

  const checkKey = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/users/check-key`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id_user: idUser,
          key: inputValue,
        }),
      }
    );
    await response.json();
    return response.status == 200; //solo devuelve 200 si se encontró el valor
  };

  const uploadKey = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/users/set-key`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id_user: idUser,
          key: inputValue,
        }),
      }
    );
    await response.json();
    return response.status == 201; //solo devuelve 200 si se encontró el valor
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    //asginar o verificar, según sea el caso
    if (hasAKey) {
      const esCorrecta = await checkKey();
      if (!esCorrecta) {
        toast.error("La clave ingresada es incorrecta");
        return;
      }
    } else {
      const procesoCorrecto = await uploadKey();
      if (!procesoCorrecto) {
        toast.error("Ocurrio un error al asignar su clave maestra");
        return;
      }
    }

    setClaveMaestra(inputValue.trim());
    toast.success("Se ha establecido la clave para la sesión");
    navigate("/galery");
  };

  return (
    <main className="flex-1 overflow-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 md:p-8"
        >
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-50 mb-2 text-balance">
            Establece tu clave global
          </h1>

          <p className="text-neutral-400 text-sm md:text-base mb-6 leading-relaxed">
            Asigna una clave maestra, la cual será usada para cifrar las
            imágenes restantes. Esta clave no se puede recuperar si la olvidas.
          </p>

          <div className="space-y-4 mb-6">
            <div className="relative">
              <input
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Introduce la clave"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
              />
            </div>
          </div>

          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 mb-6">
            <p className="text-neutral-400 text-sm leading-relaxed">
              <span className="font-semibold text-neutral-300">
                Importante:
              </span>{" "}
              Guarda esta clave en un lugar seguro. Si la olvidas, no podrás
              descifrar tus imágenes. No compartir esta clave con nadie.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-lg px-6 py-3 font-medium transition-colors"
            >
              Guardar clave
            </button>
          </div>
        </form>
        <div className="mt-8 p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
          <h2 className="text-sm font-semibold text-neutral-50 mb-3">
            ¿Por qué necesitamos una clave maestra?
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Tu clave maestra es la base de la encriptación de tus imágenes.
            Utilizamos algoritmos de seguridad de nivel empresarial para
            proteger tus datos. Solo tú tienes acceso a esta clave, garantizando
            tu confidencialidad total.
          </p>
        </div>
      </div>
    </main>
  );
}
