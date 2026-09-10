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
                    children:"API Key created"
                },
                {
                    children:"Workspace created"
                },
                {
                    children:"Layer published"
                },
                {
                    children:"Project updated"
                }
            ]}
        />
    </>
  )
}

export default Activity