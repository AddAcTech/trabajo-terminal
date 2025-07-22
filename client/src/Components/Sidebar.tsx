import { useState } from "react";
import { Link } from "react-router-dom";
import { IoMdPhotos } from "react-icons/io";
import Tooltip from "./Tooltip";
import { LuUsers, LuSettings, LuLogIn } from "react-icons/lu";

function Sidebar() {
  const [activeIcon, setActiveIcon] = useState<string>();

  const handleSetActive = (iconName: string) => {
    setActiveIcon(iconName);
  };

  //   if (!isVerified) {
  //     return (
  //       <aside className="text-gray-400 bg-white h-full p-4 lg:flex lg:flex-col justify-around border-r-2 hidden">
  //         <Lupo width={50} height={50} fill="#225432" />
  //         <Tooltip text="Settings">
  //           <Link to="/users" onClick={() => handleSetActive("LuSettings")}>
  //             <LuSettings
  //               size={30}
  //               className={`mx-auto ${
  //                 activeIcon === "LuSettings"
  //                   ? "text-levu-cal-green"
  //                   : "text-gray-400"
  //               }`}
  //             />
  //           </Link>
  //         </Tooltip>
  //       </aside>
  //     );
  //   }

  return (
    <aside className="text-gray-400 bg-white h-full p-4 lg:flex lg:flex-col justify-between hidden">
      <div className="flex flex-col gap-7 h-full py-4 mt-4">
        <Tooltip text="Galery">
          <Link to="/galery" onClick={() => handleSetActive("Galery")}>
            <IoMdPhotos
              size={30}
              className={`mx-auto ${
                activeIcon === "Galery" ? "text-black" : "text-gray-400"
              }`}
            />
          </Link>
        </Tooltip>
        <Tooltip text="Profile">
          <Link to="/settings" onClick={() => handleSetActive("Users")}>
            <LuUsers
              size={30}
              className={`mx-auto ${
                activeIcon === "Users" ? "text-black" : "text-gray-400"
              }`}
            />
          </Link>
        </Tooltip>
        <Tooltip text="Settings">
          <Link to="/encrypt" onClick={() => handleSetActive("Settings")}>
            <LuSettings
              size={30}
              className={`mx-auto ${
                activeIcon === "Settings" ? "text-black" : "text-gray-400"
              }`}
            />
          </Link>
        </Tooltip>
        <Tooltip text="Login">
          <Link to="/login" onClick={() => handleSetActive("Login")}>
            <LuLogIn
              size={30}
              className={`mx-auto ${
                activeIcon === "Login" ? "text-black" : "text-gray-400"
              }`}
            />
          </Link>
        </Tooltip>
      </div>
    </aside>
  );
}

export default Sidebar;
