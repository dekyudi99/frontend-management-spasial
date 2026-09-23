import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useSidebar } from "../context/SidebarContext";

const DashboardLayout = () => {
  const {
    isDesktopOpen,
    isMobileOpen,
    closeMobileSidebar,
    closeDesktopSidebar,
  } = useSidebar();

  const location = useLocation();

  // Dapatkan nama halaman aktif untuk judul
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/project")) return "Projects";
    if (path.includes("/workspace")) return "Workspace";
    if (path.includes("/layer")) return "Layer & Map";
    return "Dashboard";
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-100 overflow-hidden relative">
      {/* Sidebar Responsive Drawer (Mobile) & Desktop Sidebar */}
      <Sidebar
        isOpen={isMobileOpen}
        onClose={closeMobileSidebar}
        isDesktopOpen={isDesktopOpen}
        onCloseDesktop={closeDesktopSidebar}
      />

      {/* Main Content Area: Menggunakan 100% lebar layar secara bersih */}
      <main className="flex-1 overflow-y-auto w-full transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;