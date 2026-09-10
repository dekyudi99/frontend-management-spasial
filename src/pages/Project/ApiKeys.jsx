import { useState, useEffect } from 'react'
import { Button, message, Space, Table, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import keyApi from '../../api/KeyApi';
import formatTanggal from '../../utils/formatTanggal';
import ApiKeyModal from '../../components/ApiKeyModal';
import {
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"

const appName = import.meta.env.VITE_APP_NAME

const ApiKeys = ({id}) => {
    useEffect(()=>{
        document.title = `Detail Project | ${appName}`
    },[])

    const {data, isLoading, isError, error} = useQuery({
        queryKey: ["api-key", id],
        queryFn: () => keyApi.get(id)
    })

    const [open,setOpen] = useState(false)
    const queryClient = useQueryClient()

    const deleteApiKey = useMutation({
        mutationFn: (id) => keyApi.delete(id),
        onSuccess: (response) => {
            message.success(response?.data?.detail)

            queryClient.invalidateQueries({
                queryKey: ["api-key", id],
            })
        },
        onError: (err) => {
            message.error(err?.response?.data?.detail || "Failed delete api key!")
        }
    })

    if(isLoading){
      return(
        <div className="min-h-screen flex justify-center items-center">
          Loading api key list...
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

    const apiColumns = [
        {
            title: "Name",
            dataIndex: "name"
        },
        {
            title: "Key",
            dataIndex: "api_key_hash",
            render: (keyHash) => (
                <p>agis_sk_{keyHash}</p>
            )
        },
        {
            title: "Created",
            dataIndex: "created_at",
            render: (created) => (
                <p>{formatTanggal(created)}</p>
            )
        },
        {
            title: "Action",
            render: (_, record) => (
                <Space>
                    <Button>
                        Copy
                    </Button>

                    <Button 
                        danger
                        onClick={
                            () => Modal.confirm({
                                title: "Delete API Key!",
                                icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />,
                                content: `Are you sure you want to delete API Key "${record.name}"?`,
                                okText: "Delete",
                                cancelText: "Cancel",
                                okType: "danger",
                                onOk() {
                                    deleteApiKey.mutate(record.id)
                                },                                                              
                            })
                        }
                    >
                        Delete
                    </Button>
                </Space>
            )
        }
    ];

    const apiKeys = data?.data?.data

  return (
    <>
        <Button
            type="primary"
            icon={<PlusOutlined/>}
            className="mb-4"
            onClick={()=>{
                setOpen(true)
            }}
        >
            Generate API Key
        </Button>

        <Table
            rowKey="id"
            columns={apiColumns}
            dataSource={apiKeys}
            scroll={{ x: 550 }}
        />

        <ApiKeyModal
            id={id}
            open={open}
            onClose={()=>setOpen(false)}
        />
    </>
  )
}

export default ApiKeys