import { Outlet } from "react-router-dom";

function GuestLayout() {
  return (
    <div className="h-screen w-screen">
      <Outlet />
    </div>
  );
}

export default GuestLayout;
