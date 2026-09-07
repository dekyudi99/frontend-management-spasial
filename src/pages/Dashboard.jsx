import React from 'react'
import { useEffect } from 'react'
import { Row, Col, Card } from 'antd'

const appName = import.meta.env.VITE_APP_NAME

const Dashboard = () => {
  useEffect(()=>{
    document.title = `Dashboard | ${appName}`
  },[])

  return (
    <div className='text-black'>
      <Row gutter={16}>
        <Col span={6}>
            <Card>Total Project</Card>
        </Col>

        <Col span={6}>
            <Card>Workspace</Card>
        </Col>

        <Col span={6}>
            <Card>Layer</Card>
        </Col>

        <Col span={6}>
            <Card>API Key</Card>
        </Col>
    </Row>

    <Row gutter={16} className="mt-6">

        <Col span={16}>
            <Card>
                Recent Activity
            </Card>
        </Col>

        <Col span={8}>
            <Card>
                Quick Action
            </Card>
        </Col>

    </Row>

    <Row gutter={16} className="mt-6">
        <Col span={12}>
            <Card>
                System Status
            </Card>
        </Col>

        <Col span={12}>
            <Card>
                Documentation
            </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard