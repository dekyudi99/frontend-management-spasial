import React from 'react'
import BgHome from "../assets/bgHome.jpg"
import Logo from "../assets/logo2.png"
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const appName = import.meta.env.VITE_APP_NAME
const docs = import.meta.env.VITE_API_DOCS

const Landing = () => {
  useEffect(()=>{
    document.title = `${appName}`
  },[])

  const isAuthenticated = localStorage.getItem("JWT_TOKEN")

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-xs scale-110"
        style={{ backgroundImage: `url(${BgHome})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-blue-950/20" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-white gap-2">
        <img src={Logo} alt="logo" className="my-8 h-24" />
        <h1 className="text-8xl font-bold">AstraGIS Server</h1>

        <p className='text-3xl my-8'>Powered by Geoserver</p>
        <p className='text-wrap text-center mx-48 text-lg'>Automate. Integrate. Visualize. An open-source geospatial data infrastructure designed to instantly transform raw data into OGC-standard web map services. Powered by an asynchronous pipeline that eliminates client-side lag, keeping applications lightweight, responsive, and infinitely scalable.</p>
        {
          isAuthenticated?
          <Link to="/dashboard" className='px-4 py-2 bg-white text-black hover:cursor-pointer hover:bg-gray-200 my-2'>Dashboard</Link>
          :
          <Link to="/auth/login" className='px-4 py-2 bg-white text-black hover:cursor-pointer hover:bg-gray-200 my-2'>Masuk</Link>
        }

        <div className="h-0.5 w-3/4 bg-emerald-500 mx-auto mt-16 "></div>

        <div className='flex flex-row gap-16 justify-center'>
          <Link to="/documentation" className='border border-white px-2 text-lg hover:border-gray-400 hover:cursor-pointer'>Learn About AstraGIS Server </Link>
          <a href={docs} target="_blank" className='px-2 text-lg hover:cursor-pointer hover:underline'>See Endpoint List</a>
        </div>
      </div>

    </div>
  )
}

export default Landing