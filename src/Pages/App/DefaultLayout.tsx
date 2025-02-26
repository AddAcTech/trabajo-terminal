import { Outlet } from "react-router-dom";
import Sidebar from "../../Components/Sidebar";

export default function DefaultLayout() {
  return (
    <div className="flex h-screen w-screen ">
      <Sidebar />
      <div className="w-full">
        <main className="flex justify-center h-screen bg-[#edf1f4] bg-cover p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
