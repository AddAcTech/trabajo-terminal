import { useState } from "react";
import { Link } from "react-router-dom";
import { IoMdPhotos } from "react-icons/io";
import Tooltip from "./Tooltip";
import { LuUsers, LuSettings, LuLogIn } from "react-icons/lu";
import { FaFileUpload } from "react-icons/fa";

function Sidebar() {
  const [activeIcon, setActiveIcon] = useState<string>();

  const handleSetActive = (iconName: string) => {
    setActiveIcon(iconName);
  };

  return (
    <aside className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-6 gap-8">
      <div className="flex flex-col gap-7 h-full py-4 mt-4">
        <img src="/favicon-TT.svg" loading="lazy" className="mx-auto w-7.5" />
        <Tooltip text="Galeria de imagenes">
          <Link
            to="/galery"
            onClick={() => handleSetActive("Galery")}
            className="w-10 h-10 rounded-lg hover:bg-sidebar-accent/50 flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <IoMdPhotos
              size={30}
              className={`mx-auto ${
                activeIcon === "Galeria de imagenes"
                  ? "text-violet-400"
                  : "text-gray-400"
              }`}
            />
          </Link>
        </Tooltip>
        <Tooltip text="Descifrar imagen externa">
          <Link
            to="/upload-2-decrypt"
            onClick={() => handleSetActive("Users")}
            className="w-10 h-10 rounded-lg hover:bg-sidebar-accent/50 flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <FaFileUpload
              size={30}
              className={`mx-auto ${
                activeIcon === "Descifrar imagen externa"
                  ? "text-violet-400"
                  : "text-gray-400"
              }`}
            />
          </Link>
        </Tooltip>
        <Tooltip text="Profile">
          <Link
            to="/encrypt"
            onClick={() => handleSetActive("Users")}
            className="w-10 h-10 rounded-lg hover:bg-sidebar-accent/50 flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <LuUsers
              size={30}
              className={`mx-auto ${
                activeIcon === "Users" ? "text-violet-400" : "text-gray-400"
              }`}
            />
          </Link>
        </Tooltip>
        <Tooltip text="Settings">
          <Link
            to="/settings"
            onClick={() => handleSetActive("Settings")}
            className="w-10 h-10 rounded-lg hover:bg-sidebar-accent/50 flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <LuSettings
              size={30}
              className={`mx-auto ${
                activeIcon === "Settings" ? "text-violet-400" : "text-gray-400"
              }`}
            />
          </Link>
        </Tooltip>
        <Tooltip text="Login">
          <Link
            to="/login"
            onClick={() => {
              handleSetActive("Login");
              localStorage.clear();
            }}
            className="w-10 h-10 rounded-lg hover:bg-sidebar-accent/50 flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <LuLogIn
              size={30}
              className={`mx-auto ${
                activeIcon === "Login" ? "text-violet-400" : "text-gray-400"
              }`}
            />
          </Link>
        </Tooltip>
      </div>
    </aside>
  );
}

export default Sidebar;
