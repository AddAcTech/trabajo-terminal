import { Outlet } from "react-router-dom";
import Sidebar from "../../Components/Sidebar";
import { GlobalProvider } from "../../context/GlobalContext"; //para que se guarde la clave maestra

export default function DefaultLayout() {
  if (!localStorage.getItem("token")) {
    window.location.href = "/login";
  }

  return (
    <div className="flex h-screen w-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <GlobalProvider>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </GlobalProvider>
      </div>
    </div>
  );
}
