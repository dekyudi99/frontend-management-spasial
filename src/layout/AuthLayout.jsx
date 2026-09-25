import React from 'react'
import { Outlet } from 'react-router-dom'
import Logo from '../assets/logo2.png'
import { Link } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <div className='min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-gray-200'>
        <div className='w-full max-w-sm sm:max-w-md md:max-w-lg p-5 sm:p-8 bg-blue-950/95 border border-blue-900/60 rounded-2xl shadow-2xl flex flex-col justify-center items-center transition-all duration-300'>
            <Link to="/" className='transition-transform hover:scale-105 mb-2'>
                <img src={Logo} alt="AstraGIS Logo" className='h-20 sm:h-24 md:h-28 object-contain drop-shadow-md'/>
            </Link>
            <div className='w-full'>
                <Outlet/>
            </div>
        </div>
    </div>
  )
}

export default AuthLayout