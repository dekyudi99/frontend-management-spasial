import { useState, useEffect } from "react"
import {
  Typography,
  Button,
  Input,
  Empty,
  Row,
  Col,
  Spin,
  message,
  Pagination, // 👈 1. Import komponen Pagination
} from "antd"
import {
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import projectApi from "../api/ProjectApi"
import ProjectCard from "../components/ProjectCard"
import ProjectModal from "../components/ProjectModal"
import BackButton from "../components/common/BackButton"
import { useLanguage } from "../context/LanguageContext"

const { Title, Text } = Typography
const appName = import.meta.env.VITE_APP_NAME

const Project = () => {
  const { t } = useLanguage()

  useEffect(() => {
    document.title = `Project | ${appName}`
  }, [])

  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState("create")
  const [selectedProject, setSelectedProject] = useState(null)
  const [search, setSearch] = useState("")
  
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  const {
    data: responseData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["project", page, pageSize],
    queryFn: () => projectApi.getall({ page, size: pageSize }),
    keepPreviousData: true
  })

  const deleteProject = useMutation({
    mutationFn: (id) => projectApi.delete(id),
    onSuccess: () => {
      message.success(t('deleteProjectSuccess', "Project deleted successfully!"))
      queryClient.invalidateQueries({
        queryKey: ["project"]
      })
    },
    onError: (err) => {
      message.error(err.response?.data?.detail || t('deleteProjectFailed', "Failed to delete project!"))
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spin size="large" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-red-500">
        {error.response?.data?.detail || "An error occurred while loading data"}
      </div>
    )
  }

  const data = responseData?.data?.data || []
  const pagination = responseData?.data?.pagination

  const filtered = data.filter(item =>
    item.project_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <BackButton fallbackTo="/dashboard" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Title level={2} className="!mb-1">{t('projectsTitle', 'Project')}</Title>
          <Text type="secondary">
            {t('projectsSubtitle', 'Manage all your integration projects.')}
          </Text>
        </div>

        <Button
          icon={<PlusOutlined />}
          type="primary"
          className="self-start sm:self-auto"
          onClick={() => {
            setMode("create")
            setSelectedProject(null)
            setOpen(true)
          }}
        >
          {t('newProject', 'New Project')}
        </Button>
      </div>

      <Input
        prefix={<SearchOutlined />}
        placeholder={t('searchProjectPlaceholder', 'Search project name...')}
        className="mb-6"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Row gutter={[20, 20]}>
        {filtered.length === 0 ? (
          <Col span={24}>
            <Empty description={t('noProjectsFound', 'No projects found')} />
          </Col>
        ) : (
          filtered.map(project => (
            <Col
              xs={24}
              md={12}
              key={project.id}
            >
              <ProjectCard
                project={project}
                onManage={() => {
                  console.log(project.id)
                }}
                onEdit={() => {
                  setMode("edit")
                  setSelectedProject(project)
                  setOpen(true)
                }}
                onDelete={() => deleteProject.mutateAsync(project.id)}
              />
            </Col>
          ))
        )}
      </Row>

      {pagination && pagination.total > 0 && (
        <div className="flex justify-center sm:justify-end mt-8 overflow-x-auto">
          <Pagination
            current={pagination.page}
            pageSize={pagination.size}
            total={pagination.total}
            showSizeChanger
            pageSizeOptions={["6", "12", "24"]}
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} projects`}
            onChange={(newPage, newPageSize) => {
              setPage(newPage)
              setPageSize(newPageSize)
            }}
          />
        </div>
      )}

      <ProjectModal
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        project={selectedProject}
      />
    </div>
  )
}

export default Project