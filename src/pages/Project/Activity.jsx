import { useEffect } from 'react'
import { Timeline } from 'antd'

const appName = import.meta.env.VITE_APP_NAME

const Activity = () => {
    useEffect(()=>{
        document.title = `Detail Project | ${appName}`
    },[])
  return (
    <>
        <Timeline
            items={[
                {
                    children:"API Key dibuat"
                },
                {
                    children:"Workspace dibuat"
                },
                {
                    children:"Layer dipublish"
                },
                {
                    children:"Project diperbarui"
                }
            ]}
        />
    </>
  )
}

export default Activity