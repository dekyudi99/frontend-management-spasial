import { useEffect, useState } from 'react'
import { Button, Table, message, Space, Modal, Tooltip } from 'antd'
import { PlusOutlined, ExclamationCircleOutlined, CopyOutlined } from '@ant-design/icons'
import workspaceApi from '../../api/WorkspaceApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import WorkspaceModal from '../../components/WorkspaceModal'
import formatTanggal from '../../utils/formatTanggal'
import { Link, useSearchParams } from 'react-router-dom'

const appName = import.meta.env.VITE_APP_NAME

const Workspace = (props) => {
  useEffect(() => {
    document.title = `Detail Project | ${appName}`
  }, [])

  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // 1. State Pagination Disinkronkan dengan URL SearchParams
  const page = parseInt(searchParams.get('wsPage')) || 1
  const pageSize = parseInt(searchParams.get('wsPageSize')) || 5

  const setPage = (newPage) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('tab', 'workspace')
      next.set('wsPage', newPage)
      return next
    }, { replace: true })
  }

  const setPageSize = (newPageSize) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('tab', 'workspace')
      next.set('wsPageSize', newPageSize)
      next.set('wsPage', 1)
      return next
    }, { replace: true })
  }

  // 2. Query dengan Dependency page & pageSize
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['workspace', props.id, page, pageSize],
    queryFn: () => workspaceApi.list(props.id, {
      page: page,
      size: pageSize
    }),
    placeholderData: (previousData) => previousData
  })

  const deleteWorkspace = useMutation({
    mutationFn: (id) => workspaceApi.delete(id),
    onSuccess: (response) => {
      message.success(response?.data?.detail || "Workspace deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ['workspace', props.id] })
      queryClient.invalidateQueries({ queryKey: ['recentlyWorkspace', props.id] })
      queryClient.invalidateQueries({ queryKey: ['project', props.id] })
      queryClient.invalidateQueries({ queryKey: ['projectLogs', props.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-projects'] })
      queryClient.invalidateQueries({ queryKey: ['user-workspaces'] })
    },
    onError: (err) => {
      message.error(err?.response?.data?.detail || "Failed to delete workspace!")
    }
  })

  const workspaceColumns = [
    {
      title: "Workspace",
      dataIndex: "name",
      key: "name"
    },
    {
      title: "Workspace ID",
      dataIndex: "id",
      key: "id",
      render: (id) => (
        <Space size="small">
          <code className="text-xs bg-slate-100 text-blue-700 font-mono px-2 py-0.5 rounded border border-slate-200 font-semibold">
            {id}
          </code>
          <Tooltip title="Copy Workspace ID">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined className="text-slate-400 hover:text-blue-600 text-xs" />}
              onClick={() => {
                navigator.clipboard.writeText(id);
                message.success("Workspace ID copied to clipboard!");
              }}
            />
          </Tooltip>
        </Space>
      )
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
            loading={deleteWorkspace.isPending && deleteWorkspace.variables === record.id}
            disabled={deleteWorkspace.isPending && deleteWorkspace.variables !== record.id}
            onClick={() => Modal.confirm({
              title: "Delete Workspace!",
              icon: <ExclamationCircleOutlined className="text-red-500" />,
              content: `Do you really want to delete workspace "${record.name}"?`,
              okText: "Delete",
              cancelText: "Cancel",
              okType: "danger",
              onOk() {
                return new Promise((resolve, reject) => {
                  deleteWorkspace.mutate(record.id, {
                    onSuccess: () => resolve(),
                    onError: (err) => reject(err),
                  })
                })
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
        {error?.response?.data?.detail || "Failed to load workspace"}
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
          total: paginationData?.total || 0,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} workspaces`,
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