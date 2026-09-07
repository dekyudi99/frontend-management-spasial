import React from 'react'
import Decision from '../assets/decision.png'
import { useEffect } from 'react'

const appName = import.meta.env.VITE_APP_NAME

const NotFound = () => {
    useEffect(()=>{
        document.title = `Not Found | ${appName}`
    },[])
  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
        <img src={Decision} alt="" />
        <p className='text-2xl'><span className='font-bold'>404 Not Found</span>, Something went wrong!</p>
    </div>
  )
}

export default NotFound