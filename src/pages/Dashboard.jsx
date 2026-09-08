import React from 'react'
import { useEffect } from 'react'
import { Row, Col, Card } from 'antd'

const appName = import.meta.env.VITE_APP_NAME

const Dashboard = () => {
  useEffect(()=>{
    document.title = `Dashboard | ${appName}`
  },[])

  return (
    <div className='text-black p-4 sm:p-6 md:p-8'>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
            <Card>Total Project</Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
            <Card>Workspace</Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
            <Card>Layer</Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
            <Card>API Key</Card>
        </Col>
    </Row>

    <Row gutter={[16, 16]} className="mt-6">

        <Col xs={24} lg={16}>
            <Card>
                Recent Activity
            </Card>
        </Col>

        <Col xs={24} lg={8}>
            <Card>
                Quick Action
            </Card>
        </Col>

    </Row>

    <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} md={12}>
            <Card>
                System Status
            </Card>
        </Col>

        <Col xs={24} md={12}>
            <Card>
                Documentation
            </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard