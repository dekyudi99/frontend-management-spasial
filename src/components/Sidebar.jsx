import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  GlobeAltIcon,
  FolderIcon,
  KeyIcon,
  ShieldCheckIcon,
  MapIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import DocumentationLogo from "../assets/open-book.png";
import ApiLogo from "../assets/notes.png";
import { useLanguage } from "../context/LanguageContext";
import authApi from "../api/AuthApi";
import keyApi from "../api/KeyApi";

const docs = import.meta.env.VITE_API_DOCS;

const Sidebar = ({
  isOpen = false,
  onClose,
  isDesktopOpen = true,
  onCloseDesktop,
}) => {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [isKeyDisabled, setIsKeyDisabled] = useState(false);

  useEffect(() => {
    authApi.getProfile()
      .then(res => {
        const user = res.data?.data || res.data?.user || res.data;
        setCurrentUser(user);
      })
      .catch(() => {});

    keyApi.getMyKey()
      .then(res => {
        const key = res.data;
        if (key && key.is_active === false) {
          setIsKeyDisabled(true);
          localStorage.removeItem("astragis_s2s_key");
        } else if (key && key.is_active && (key.full_key || key.plain_key)) {
          setIsKeyDisabled(false);
          localStorage.setItem("astragis_s2s_key", key.full_key || key.plain_key);
        }
      })
      .catch(() => {});
  }, []);

  const menus = [
    {
      text: t('menuWorkspace', "Workspace"),
      to: "/dashboard/workspace",
      icon: <FolderIcon className="w-5 h-5 flex-shrink-0 mr-3 text-blue-200" />,
      target: "",
      locked: isKeyDisabled,
    },
    {
      text: t('menuLayer', "Layer & Peta"),
      to: "/dashboard/layer",
      icon: <MapIcon className="w-5 h-5 flex-shrink-0 mr-3 text-blue-200" />,
      target: "",
      locked: isKeyDisabled,
    },
    {
      text: t('menuApiKey', "API Key (S2S)"),
      to: "/dashboard/api-key",
      icon: <KeyIcon className="w-5 h-5 flex-shrink-0 mr-3 text-white" />,
      target: "",
    },
    ...(currentUser?.role === "admin" ? [
      {
        text: t('menuAdminPanel', "Admin Panel"),
        to: "/dashboard/admin",
        icon: <ShieldCheckIcon className="w-5 h-5 flex-shrink-0 mr-3 text-white" />,
        target: "",
      }
    ] : []),
    {
      text: t('menuDocumentation', "Dokumentasi"),
      to: "/documentation",
      image: DocumentationLogo,
      target: "_blank",
    },
    {
      text: t('menuEndpointList', "Endpoint API"),
      to: docs,
      image: ApiLogo,
      target: "_blank",
    },
  ];

  return (
    <>
      {/* 1. MOBILE DRAWER */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={onClose}
            aria-hidden="true"
          />

          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out">
            <div className="flex items-center justify-between p-5 border-b border-blue-800">
              <Link
                to="/dashboard"
                onClick={() => onClose?.()}
                className="text-xl font-bold tracking-wider text-white hover:text-blue-200 transition"
              >
                {t('menuDashboard', 'Dashboard')}
              </Link>

              <button
                onClick={onClose}
                className="p-1.5 text-blue-300 hover:text-white hover:bg-blue-800 rounded-lg transition cursor-pointer"
                title={t('closeSidebar', 'Tutup Sidebar')}
                aria-label={t('closeSidebar', 'Tutup Sidebar')}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 flex flex-col py-3 overflow-y-auto space-y-1">
              {menus.map((menu) => (
                <SideMenu key={menu.to} {...menu} onMenuClick={onClose} />
              ))}
            </nav>

            <div className="p-4 border-t border-blue-800 text-xs text-blue-300 text-center">
              &copy; 2026 AstraGIS
            </div>
          </aside>
        </div>
      )}

      {/* 2. DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col bg-blue-900 text-white flex-shrink-0 h-full transition-all duration-300 ease-in-out relative border-r border-blue-800 ${
          isDesktopOpen ? "w-64" : "w-0 overflow-hidden border-none opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-blue-800 min-w-[16rem]">
          <Link
            to="/dashboard"
            className="text-xl font-bold tracking-wider text-white hover:text-blue-200 transition"
          >
            {t('menuDashboard', 'Dashboard')}
          </Link>

          <button
            onClick={onCloseDesktop}
            className="p-1.5 text-blue-300 hover:text-white hover:bg-blue-800 rounded-lg transition cursor-pointer"
            title={t('closeSidebar', 'Tutup Sidebar')}
            aria-label={t('closeSidebar', 'Tutup Sidebar')}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 flex flex-col py-3 overflow-y-auto space-y-1 min-w-[16rem]">
          {menus.map((menu) => (
            <SideMenu key={menu.to} {...menu} />
          ))}
        </nav>

        <div className="p-4 border-t border-blue-800 text-xs text-blue-300 text-center min-w-[16rem]">
          &copy; 2026 AstraGIS
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

function SideMenu({ image, icon, text, to, target, locked, onMenuClick }) {
  const { t } = useLanguage();
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      target={target}
      onClick={() => onMenuClick?.()}
      className={({ isActive }) =>
        `flex items-center justify-between px-5 py-3.5 transition-all duration-200 text-sm font-medium
        ${
          isActive
            ? "bg-blue-800 text-white border-r-4 border-white shadow-inner"
            : "text-blue-100 hover:bg-blue-800/60 hover:text-white"
        }`
      }
    >
      <div className="flex items-center min-w-0">
        {image ? (
          <img src={image} alt={text} className="w-5 h-5 object-contain flex-shrink-0 mr-3" />
        ) : icon ? (
          icon
        ) : null}
        <span className="truncate">{text}</span>
      </div>
      {locked && (
        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-900/60 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded-full">
          <LockClosedIcon className="w-3 h-3 text-rose-400" />
          <span>{t('statusInactive', 'Nonaktif')}</span>
        </span>
      )}
    </NavLink>
  );
}