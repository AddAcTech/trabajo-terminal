import { Outlet } from "react-router-dom";
import Sidebar from "../../Components/Sidebar";
import { GlobalProvider } from "../../context/GlobalContext"; //para que se guarde la clave maestra

export default function DefaultLayout() {
  return (
    <div className="flex h-screen w-screen ">
      <Sidebar />
      <div className="w-full">
        <GlobalProvider>
          <main className="flex justify-center h-screen bg-[#edf1f4] bg-cover p-3">
            <Outlet />
          </main>
        </GlobalProvider>
      </div>
    </div>
  );
}
