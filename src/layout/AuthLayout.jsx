import React from 'react'
import { Outlet } from 'react-router-dom'
import Logo from '../assets/logo2.png'
import { Link } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <div className='min-h-screen flex flex-col justify-center items-center'>
        <div className='m-8 p-4 bg-blue-950 rounded-2xl flex flex-col justify-center items-center w-1/2'>
            <Link to="/">
                <img src={Logo} alt="" className='h-28'/>
            </Link>
            <Outlet/>
        </div>
    </div>
  )
}

export default AuthLayout