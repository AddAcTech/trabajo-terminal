"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface GlobalContextType {
  claveMaestra: string | null;
  setClaveMaestra: (key: string) => void;
  isExpired: boolean;
  clearClaveMaestra: () => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);
const MINUTOS_DE_VIDA = 30;
const MINUTOS_EXPIRACION = 2;

export const GlobalProvider = ({ children }: { children: ReactNode }) => {

    const [claveMaestra, setClaveMaestraEstado] = useState<string | null>(null);    
    const [isExpired, setIsExpired] = useState<boolean>(false);
    

// Guardar con timestamp
  const setClaveMaestra = (key: string) => {
    const now = Date.now();
    const expiresAt = now + MINUTOS_DE_VIDA * 60 * 1000;
    localStorage.setItem("claveMaestra", key);
    localStorage.setItem("claveMaestra_exp", expiresAt.toString());
    setClaveMaestraEstado(key);
    setIsExpired(false);
  };

  const clearClaveMaestra = () => {
    localStorage.removeItem("claveMaestra");
    localStorage.removeItem("claveMaestra_exp");
    setClaveMaestraEstado(null);
    setIsExpired(true);
  };

  // Leer al cargar
  useEffect(() => {
    const savedKey = localStorage.getItem("claveMaestra");
    const exp = localStorage.getItem("claveMaestra_exp");

    if (savedKey && exp) {
      const expTime = parseInt(exp, 10);
      const now = Date.now();
      if (now > expTime) {
        // Expirada
        clearClaveMaestra();
      } else {
        setClaveMaestraEstado(savedKey);
        setIsExpired(false);
      }
    }
  }, []);

  // Verificación periódica de expiración
  useEffect(() => {
    const interval = setInterval(() => {
      const exp = localStorage.getItem("claveMaestra_exp");
      if (!exp) return;
      const expTime = parseInt(exp, 10);
      if (Date.now() > expTime) {
        clearClaveMaestra();
      }
    }, 1000 * 60 * MINUTOS_EXPIRACION); // cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <GlobalContext.Provider value={{ claveMaestra, setClaveMaestra, isExpired, clearClaveMaestra }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error("useGlobal debe usarse dentro de <GlobalProvider>");
    return context;
};
