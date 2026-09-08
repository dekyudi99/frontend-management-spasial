import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Bars3Icon } from "@heroicons/react/24/outline";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dapatkan nama halaman aktif untuk mobile topbar
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/project")) return "Projects";
    if (path.includes("/workspace")) return "Workspace";
    if (path.includes("/layer")) return "Layer & Map";
    return "Dashboard";
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-100 overflow-hidden relative">
      {/* Mobile Header Bar dengan Hamburger Button: HANYA tampil di layar < md */}
      <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-blue-900 text-white shadow-sm z-30 flex-shrink-0 w-full">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-lg bg-blue-800 hover:bg-blue-700 text-white focus:outline-none transition active:scale-95 cursor-pointer"
          aria-label="Buka Menu"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        <span className="font-semibold text-sm tracking-wide">
          {getPageTitle()}
        </span>

        {/* Spacer untuk menyeimbangkan tombol hamburger */}
        <div className="w-8" />
      </div>

      {/* Sidebar Responsive Drawer */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area: Menggunakan 100% lebar layar di mobile */}
      <main className="flex-1 overflow-y-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;