import React, { createContext, useContext, useState } from "react";

const SidebarContext = createContext({
  isDesktopOpen: true,
  isMobileOpen: false,
  toggleDesktopSidebar: () => {},
  closeDesktopSidebar: () => {},
  openDesktopSidebar: () => {},
  toggleMobileSidebar: () => {},
  closeMobileSidebar: () => {},
  openMobileSidebar: () => {},
});

export const SidebarProvider = ({ children }) => {
  const [isDesktopOpen, setIsDesktopOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("astragis_desktop_sidebar");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleDesktopSidebar = () => {
    setIsDesktopOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("astragis_desktop_sidebar", JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to save sidebar state to localStorage", e);
      }
      return next;
    });
  };

  const closeDesktopSidebar = () => {
    setIsDesktopOpen(false);
    try {
      localStorage.setItem("astragis_desktop_sidebar", JSON.stringify(false));
    } catch (e) {
      console.warn("Failed to save sidebar state to localStorage", e);
    }
  };

  const openDesktopSidebar = () => {
    setIsDesktopOpen(true);
    try {
      localStorage.setItem("astragis_desktop_sidebar", JSON.stringify(true));
    } catch (e) {
      console.warn("Failed to save sidebar state to localStorage", e);
    }
  };

  const toggleMobileSidebar = () => setIsMobileOpen((prev) => !prev);
  const closeMobileSidebar = () => setIsMobileOpen(false);
  const openMobileSidebar = () => setIsMobileOpen(true);

  return (
    <SidebarContext.Provider
      value={{
        isDesktopOpen,
        isMobileOpen,
        toggleDesktopSidebar,
        closeDesktopSidebar,
        openDesktopSidebar,
        toggleMobileSidebar,
        closeMobileSidebar,
        openMobileSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
