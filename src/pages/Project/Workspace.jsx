import { useEffect, useState } from 'react'
import { Button, Table, message, Space, Modal } from 'antd'
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import workspaceApi from '../../api/WorkspaceApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import WorkspaceModal from '../../components/WorkspaceModal'
import formatTanggal from '../../utils/formatTanggal'
import { Link } from 'react-router-dom'

const appName = import.meta.env.VITE_APP_NAME

const Workspace = (props) => {
  useEffect(() => {
    document.title = `Detail Project | ${appName}`
  }, [])

  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  // 1. State Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // 2. Query dengan Dependency page & pageSize
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["workspaces", props.id, page, pageSize],
    queryFn: () => workspaceApi.list(props.id, { page, size: pageSize }),
    keepPreviousData: true
  })

  const deleteWorkspace = useMutation({
    mutationFn: (id) => workspaceApi.delete(id),
    onSuccess: (response) => {
      message.success(response?.data?.detail || "Workspace berhasil dihapus!")
      queryClient.invalidateQueries({
        queryKey: ["workspaces", props.id],
      })
    },
    onError: (err) => {
      message.error(err?.response?.data?.detail || "Failed delete workspace!")
    }
  })

  const workspaceColumns = [
    {
      title: "Workspace",
      dataIndex: "name",
      key: "name"
    },
    {
      title: "Layers",
      dataIndex: "layer_count",
      key: "layer_count"
    },
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
      key: "action",
      render: (_, record) => (
        <Space>
          <Link to={`/dashboard/project/detail/${props.id}/workspace/${record.id}`}>
            Manage
          </Link>

          <Button 
            danger
            loading={deleteWorkspace.isPending}
            onClick={() => Modal.confirm({
              title: "Delete Workspace!",
              icon: <ExclamationCircleOutlined className="text-red-500" />,
              content: `Do you really want to delete workspace "${record.name}"?`,
              okText: "Delete",
              cancelText: "Cancel",
              okType: "danger",
              onOk() {
                deleteWorkspace.mutate(record.id)
              },
            })}
          >
            Delete
          </Button>
        </Space>
      )
    },
  ]

  if (isLoading) {
    return (
      <div className="min-h-75 flex justify-center items-center">
        Loading workspace list...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-red-500">
        {error?.response?.data?.detail || "Gagal memuat workspace"}
      </div>
    )
  }

  const workspace = data?.data?.data || []
  const paginationData = data?.data?.pagination

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        className="mb-4"
        onClick={() => setOpen(true)}
      >
        New Workspace
      </Button>

      <Table
        rowKey="id"
        columns={workspaceColumns}
        dataSource={workspace}
        scroll={{ x: 500 }}
        pagination={{
          current: paginationData?.page || page,
          pageSize: paginationData?.size || pageSize,
          total: paginationData?.total-1 || 0,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} workspace`,
          onChange: (newPage, newPageSize) => {
            setPage(newPage)
            setPageSize(newPageSize)
          }
        }}
      />

      <WorkspaceModal
        id={props.id}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

export default Workspace