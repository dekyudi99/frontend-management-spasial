import React from 'react'
import Header from '../components/Header'
import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '../context/SidebarContext'

const MainLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen">
        <Header />

        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  )
}

export default MainLayout