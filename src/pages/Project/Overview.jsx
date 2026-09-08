import { useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Button } from 'antd'
import { DatabaseOutlined, GlobalOutlined, KeyOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import workspaceApi from '../../api/WorkspaceApi'
import formatTanggal from '../../utils/formatTanggal'
import { Link } from 'react-router-dom'

const appName = import.meta.env.VITE_APP_NAME

const Overview = (props) => {
    useEffect(()=>{
        document.title = `Detail Project | ${appName}`
    },[])

    const {data, isLoading, isError, error} = useQuery({
        queryKey: ["recentlyWorkspace", props.id],
        queryFn: () => workspaceApi.getRecently(props.id)
    })

    if(isLoading){
      return(
        <div className="min-h-screen flex justify-center items-center">
          Loading recently workspace...
        </div>
      )
    }

    if(isError){
      return(
        <div className="p-8 text-red-500">
          {error.response?.data?.detail}
        </div>
      )
    }

    const workspaceColumns = [
        {
            title: "Workspace",
            dataIndex: "name"
        },
        {
            title: "Layers",
            dataIndex: "layer_count",
        },
        // {
        //     title: "Status",
        //     render: () => (
        //         <Tag color="green">
        //             Connected
        //         </Tag>
        //     )
        // },
        {
            title: "Created At",
            dataIndex: "created_at",
            render: (created) => (
                <div>
                    {formatTanggal(created)}
                </div>
            )
        },
        {
            title: "Action",
            render: (_, record) => (
                <Link to={`/dashboard/project/detail/${props.id}/workspace/${record.id}`}>
                    Manage
                </Link>
            )
        },
    ];

    const workspace = data?.data?.data

  return (
    <>
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
                <Card>
                    <Statistic
                        title="Workspace"
                        value={props.workspace_count}
                        prefix={<DatabaseOutlined/>}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card>
                    <Statistic
                        title="Layers"
                        value={props.layer_count}
                        prefix={<GlobalOutlined/>}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card>
                    <Statistic
                        title="API Keys"
                        value={props.api_key_count}
                        prefix={<KeyOutlined/>}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card>
                    <Statistic
                        title="Requests"
                        value={12564}
                    />
                </Card>
            </Col>
        </Row>

        <Card
            title="Recent Workspace"
            className="mt-6"
        >
            <Table
                pagination={false}
                columns={workspaceColumns}
                dataSource={workspace}
                rowKey="id"
                scroll={{ x: 450 }}
            />
        </Card>
    </>
  )
}

export default Overview