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
    const id_user = sessionStorage.getItem('id');
        if(id_user == null){
          toast.error("No se encuentra la sesión, incie sesión de nuevo");
          navigate("/login");
        }else{ //un else redundante, pero así el tipado me deja continuar
          setIdUser(parseInt(id_user));
        }
  }, [])
  

  useEffect(() => {
      if(idUser == 0) //que se ejecute cuando ya se tenga un valor
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
              })
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
                key: inputValue
              })
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
            key: inputValue
          })
        }
      );
      await response.json();
      return response.status == 201; //solo devuelve 200 si se encontró el valor
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    //asginar o verificar, según sea el caso
    if (hasAKey){
      const esCorrecta = await checkKey();
      if(!esCorrecta){
        toast.error("La clave ingresada es incorrecta");
        return;
      }
    }else{
      const procesoCorrecto = await uploadKey();
      if(!procesoCorrecto){
        toast.error("Ocurrio un error al asignar su clave maestra");
        return;
      }
    }

    setClaveMaestra(inputValue.trim());
    toast.success("Se ha establecido la clave para la sesión");
    navigate("/galery");
  };


  return (
    <div className="flex flex-col justify-center items-center text-black rounded-b-2xl">
      <h1 className="text-3xl mb-6">Establece tu clave global</h1>
      <h3 className="text-1xl mb-6 ">
        {hasAKey?"Ingrese su clave maestra":"Asinge una clave maestra, la cual será usada para cifrar las imagenes restantes"}
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="password"
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

