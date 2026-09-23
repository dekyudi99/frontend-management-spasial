import React from "react";
import { NavLink, Link } from "react-router-dom";
import { XMarkIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import ProjectLogo from "../assets/project.png";
import LayerLogo from "../assets/layer.png";
import DocumentationLogo from "../assets/open-book.png";
import ApiLogo from "../assets/notes.png";

const docs = import.meta.env.VITE_API_DOCS;

const menus = [
  {
    text: "Project",
    to: "/dashboard/project",
    image: ProjectLogo,
    target: "",
  },
  {
    text: "Layer",
    to: "/dashboard/layer",
    image: LayerLogo,
    target: "",
  },
  {
    text: "Documentation",
    to: "/documentation",
    image: DocumentationLogo,
    target: "_blank",
  },
  {
    text: "Endpoint List",
    to: docs,
    image: ApiLogo,
    target: "_blank",
  },
];

const Sidebar = ({
  isOpen = false,
  onClose,
  isDesktopOpen = true,
  onCloseDesktop,
}) => {
  return (
    <>
      {/* ============================================================ */}
      {/* 1. MOBILE DRAWER (Hanya di-render jika isOpen = true di mobile)*/}
      {/* ============================================================ */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Mobile Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Container Melayang */}
          <aside
            className="fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out"
          >
            {/* Header Mobile dengan tombol Close (X) */}
            <div className="flex items-center justify-between p-5 border-b border-blue-800">
              <Link
                to="/dashboard"
                onClick={() => onClose?.()}
                className="text-xl font-bold tracking-wider text-white hover:text-blue-200 transition"
              >
                Dashboard
              </Link>

              <button
                onClick={onClose}
                className="p-1.5 text-blue-300 hover:text-white hover:bg-blue-800 rounded-lg transition cursor-pointer"
                aria-label="Close Sidebar"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Menus */}
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

      {/* ============================================================ */}
      {/* 2. DESKTOP SIDEBAR (Hanya aktif di layar desktop >= md)      */}
      {/* ============================================================ */}
      <aside
        className={`hidden md:flex flex-col bg-blue-900 text-white flex-shrink-0 h-full transition-all duration-300 ease-in-out relative border-r border-blue-800 ${
          isDesktopOpen ? "w-64" : "w-0 overflow-hidden border-none opacity-0 pointer-events-none"
        }`}
      >
        {/* Header Desktop dengan tombol Tutup (X) */}
        <div className="flex items-center justify-between p-5 border-b border-blue-800 min-w-[16rem]">
          <Link
            to="/dashboard"
            className="text-xl font-bold tracking-wider text-white hover:text-blue-200 transition"
          >
            Dashboard
          </Link>

          {/* Tombol Tutup Sidebar Desktop */}
          <button
            onClick={onCloseDesktop}
            className="p-1.5 text-blue-300 hover:text-white hover:bg-blue-800 rounded-lg transition cursor-pointer"
            title="Tutup Sidebar"
            aria-label="Tutup Sidebar"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Menus */}
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

function SideMenu({ image, text, to, target, onMenuClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      target={target}
      onClick={() => onMenuClick?.()}
      className={({ isActive }) =>
        `flex items-center gap-3 px-5 py-3.5 transition-all duration-200 text-sm font-medium
        ${
          isActive
            ? "bg-blue-800 text-white border-r-4 border-white shadow-inner"
            : "text-blue-100 hover:bg-blue-800/60 hover:text-white"
        }`
      }
    >
      <img src={image} alt={text} className="w-5 h-5 object-contain flex-shrink-0 mr-3" />
      <span className="truncate">{text}</span>
    </NavLink>
  );
}