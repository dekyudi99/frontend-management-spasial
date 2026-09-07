import Sleep from '../assets/sleep.png'
import { useEffect } from 'react'

const appName = import.meta.env.VITE_APP_NAME

const Documentation = () => {
    useEffect(()=>{
        document.title = `Documentation | ${appName}`
    },[])
    
  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
        <img src={Sleep} alt="" />
        <p className='font-bold text-2xl gap-2'>Dokumentasi belum dibuat, Developer sedang malas...</p>
    </div>
  )
}

export default Documentation