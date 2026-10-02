import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  Tabs,
  Button,
  Tag,
  Modal,
  Spin,
  Empty,
  Pagination,
  Select,
  message,
  Tooltip,
  Divider,
} from "antd";
import {
  SearchOutlined,
  GlobalOutlined,
  FolderOpenOutlined,
  DatabaseOutlined,
  UserOutlined,
  CalendarOutlined,
  CopyOutlined,
  EyeOutlined,
  BranchesOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import publicApi from "../api/PublicApi";
import projectApi from "../api/ProjectApi";
import { formatDate } from "../utils/formatters";
import { useLanguage } from "../context/LanguageContext";
import BackButton from "../components/BackButton";

const appName = import.meta.env.VITE_APP_NAME || "AstraGIS";

const PublicHub = () => {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = `${t("publicHubTitle", "Explore Public Data Hub")} | ${appName}`;
  }, [t]);

  const [activeTab, setActiveTab] = useState("projects");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Modal State
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState(null);
  const [cloneWorkspaceName, setCloneWorkspaceName] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Query: Public Projects
  const {
    data: projectsData,
    isLoading: loadingProjects,
    isError: errorProjects,
  } = useQuery({
    queryKey: ["public-projects", page, debouncedSearch],
    queryFn: () =>
      publicApi.getProjects({
        page,
        size: pageSize,
        search: debouncedSearch,
      }),
    enabled: activeTab === "projects",
    placeholderData: (prev) => prev,
  });

  // Query: Public Workspaces
  const {
    data: workspacesData,
    isLoading: loadingWorkspaces,
    isError: errorWorkspaces,
  } = useQuery({
    queryKey: ["public-workspaces", page, debouncedSearch],
    queryFn: () =>
      publicApi.getWorkspaces({
        page,
        size: pageSize,
        search: debouncedSearch,
      }),
    enabled: activeTab === "workspaces",
    placeholderData: (prev) => prev,
  });

  // Query: Selected Project Detail (with its public workspaces)
  const { data: projectDetailData, isLoading: loadingProjectDetail } = useQuery({
    queryKey: ["public-project-detail", selectedProject?.id],
    queryFn: () => publicApi.getProjectDetail(selectedProject.id),
    enabled: Boolean(selectedProject?.id),
  });

  // Query: Selected Workspace Layers
  const { data: workspaceLayersData, isLoading: loadingWorkspaceLayers } =
    useQuery({
      queryKey: ["public-workspace-layers", selectedWorkspace?.id],
      queryFn: () =>
        publicApi.getWorkspaceLayers(selectedWorkspace.id, { page: 1, size: 50 }),
      enabled: Boolean(selectedWorkspace?.id),
    });

  // Query: Current User's Projects for Clone target
  const { data: userProjectsData } = useQuery({
    queryKey: ["my-projects-for-clone"],
    queryFn: () => projectApi.getall({ page: 1, size: 100 }),
    enabled: cloneModalOpen,
  });

  // Mutation: Clone Workspace
  const cloneMutation = useMutation({
    mutationFn: ({ wsId, targetProjId, name }) =>
      publicApi.cloneWorkspace(wsId, {
        target_project_id: targetProjId,
        new_workspace_name: name || undefined,
      }),
    onSuccess: (res) => {
      message.success(
        res?.data?.detail || t("cloneSuccess", "Workspace and its layers successfully cloned!")
      );
      setCloneModalOpen(false);
      setSelectedWorkspace(null);
      setTargetProjectId(null);
      setCloneWorkspaceName("");
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["workspace"] });

      // Navigate to cloned workspace if available
      const clonedData = res?.data?.data;
      if (clonedData?.project_id && clonedData?.id) {
        navigate(
          `/dashboard/project/detail/${clonedData.project_id}/workspace/${clonedData.id}`
        );
      }
    },
    onError: (err) => {
      message.error(
        err?.response?.data?.detail ||
          t("cloneFailed", "Failed to clone workspace. Please login or verify permissions.")
      );
    },
  });

  const handleOpenClone = (ws) => {
    setSelectedWorkspace(ws);
    setCloneWorkspaceName(`${ws.name} (Clone)`);
    setCloneModalOpen(true);
  };

  const handleConfirmClone = () => {
    if (!targetProjectId) {
      message.warning(t("selectTargetProjectWarn", "Please select a target project!"));
      return;
    }
    cloneMutation.mutate({
      wsId: selectedWorkspace.id,
      targetProjId: targetProjectId,
      name: cloneWorkspaceName,
    });
  };

  const projectList = Array.isArray(projectsData?.data?.data) ? projectsData.data.data : [];
  const projectPagination = projectsData?.data?.pagination;

  const workspaceList = Array.isArray(workspacesData?.data?.data) ? workspacesData.data.data : [];
  const workspacePagination = workspacesData?.data?.pagination;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <BackButton fallbackTo="/dashboard" />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-10 mb-8 shadow-xl border border-blue-800/40">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <GlobalOutlined /> {t("communityHubBadge", "Community Open Hub")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            {t("spatialDataHubTitle", "Spatial Data Hub")}
          </h1>
          <p className="text-sm sm:text-base text-blue-200/90 leading-relaxed">
            {t(
              "spatialDataHubDesc",
              "Explore, preview, and use public spatial datasets shared by researchers and the community. Clone workspaces and their layers directly into your projects with a single click."
            )}
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <GlobalOutlined className="text-[280px]" />
        </div>
      </div>

      {/* Search & Tabs Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-80">
          <Input
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder={
              activeTab === "projects"
                ? t("searchPublicProjects", "Search public projects...")
                : t("searchPublicWorkspaces", "Search public workspaces...")
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            size="large"
            className="rounded-xl border-slate-300 hover:border-blue-500 focus:border-blue-500"
          />
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(k) => {
            setActiveTab(k);
            setPage(1);
          }}
          className="hub-tabs"
          items={[
            {
              key: "projects",
              label: (
                <span className="flex items-center gap-2 px-1 text-sm font-semibold">
                  <FolderOpenOutlined /> {t("publicProjects", "Projects")}
                </span>
              ),
            },
            {
              key: "workspaces",
              label: (
                <span className="flex items-center gap-2 px-1 text-sm font-semibold">
                  <DatabaseOutlined /> {t("publicWorkspaces", "Workspaces")}
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* Content Section: Projects */}
      {activeTab === "projects" && (
        <div>
          {loadingProjects ? (
            <div className="min-h-[300px] flex justify-center items-center">
              <Spin size="large" />
            </div>
          ) : errorProjects ? (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-200">
              {t("loadPublicProjectsFailed", "Failed to load public projects.")}
            </div>
          ) : projectList.length === 0 ? (
            <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Empty
                description={
                  <span className="text-slate-500 font-medium">
                    {debouncedSearch
                      ? t("noPublicProjectsMatch", "No public projects match your search.")
                      : t("noPublicProjectsAvailable", "No public projects shared yet.")}
                  </span>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectList.map((p) => (
                <Card
                  key={p.id}
                  hoverable
                  className="rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  styles={{ body: { padding: "20px", display: "flex", flexDirection: "column", height: "100%" } }}
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-lg text-slate-800 line-clamp-1 m-0">
                        {p.project_name}
                      </h3>
                      <Tag color="success" className="m-0 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <GlobalOutlined /> {t("visibilityPublic", "Public")}
                      </Tag>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-4">
                      {p.description || t("noDescription", "No description provided.")}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <UserOutlined className="text-slate-400" />
                        <span className="font-medium text-slate-700">{p.owner}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <CalendarOutlined className="text-slate-400" />
                        <span>{formatDate(p.created_at, currentLanguage)}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <Tag color="blue" icon={<DatabaseOutlined />} className="text-xs px-2 py-0.5 rounded-lg">
                        {p.workspace_count || 0} {t("workspacesCount", "Workspaces")}
                      </Tag>
                      <Tag color="purple" icon={<BranchesOutlined />} className="text-xs px-2 py-0.5 rounded-lg">
                        {p.layer_count || 0} {t("layersCount", "Layers")}
                      </Tag>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => setSelectedProject(p)}
                      className="bg-blue-600 hover:bg-blue-500 text-xs font-medium rounded-lg"
                    >
                      {t("viewWorkspaces", "View Workspaces")}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {projectPagination && projectPagination.total > pageSize && (
            <div className="flex justify-center mt-8">
              <Pagination
                current={projectPagination.page}
                pageSize={projectPagination.size}
                total={projectPagination.total}
                onChange={(newPage) => setPage(newPage)}
                showTotal={(total) => `${total} ${t("projectsTotal", "projects total")}`}
              />
            </div>
          )}
        </div>
      )}

      {/* Content Section: Workspaces */}
      {activeTab === "workspaces" && (
        <div>
          {loadingWorkspaces ? (
            <div className="min-h-[300px] flex justify-center items-center">
              <Spin size="large" />
            </div>
          ) : errorWorkspaces ? (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-200">
              {t("loadPublicWorkspacesFailed", "Failed to load public workspaces.")}
            </div>
          ) : workspaceList.length === 0 ? (
            <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Empty
                description={
                  <span className="text-slate-500 font-medium">
                    {debouncedSearch
                      ? t("noPublicWorkspacesMatch", "No public workspaces match your search.")
                      : t("noPublicWorkspacesAvailable", "No public workspaces shared yet.")}
                  </span>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaceList.map((ws) => (
                <Card
                  key={ws.id}
                  hoverable
                  className="rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  styles={{ body: { padding: "20px", display: "flex", flexDirection: "column", height: "100%" } }}
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-lg text-slate-800 line-clamp-1 m-0">
                        {ws.name}
                      </h3>
                      <Tag color="success" className="m-0 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <GlobalOutlined /> {t("visibilityPublic", "Public")}
                      </Tag>
                    </div>

                    <div className="text-xs text-slate-500 mb-3">
                      <span>{t("project", "Project")}: </span>
                      <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {ws.project_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <UserOutlined className="text-slate-400" />
                        <span className="font-medium text-slate-700">{ws.owner}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <CalendarOutlined className="text-slate-400" />
                        <span>{formatDate(ws.created_at, currentLanguage)}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <Tag color="blue" icon={<DatabaseOutlined />} className="text-xs px-2 py-0.5 rounded-lg">
                        {ws.layer_count || 0} {t("layersCount", "Layers")}
                      </Tag>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => setSelectedWorkspace(ws)}
                      className="text-xs font-medium"
                    >
                      {t("inspectLayers", "Preview")}
                    </Button>

                    <Button
                      type="primary"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleOpenClone(ws)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-xs font-medium rounded-lg"
                    >
                      {t("cloneToMyProject", "Clone Workspace")}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {workspacePagination && workspacePagination.total > pageSize && (
            <div className="flex justify-center mt-8">
              <Pagination
                current={workspacePagination.page}
                pageSize={workspacePagination.size}
                total={workspacePagination.total}
                onChange={(newPage) => setPage(newPage)}
                showTotal={(total) => `${total} ${t("workspacesTotal", "workspaces total")}`}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal: Project Detail & Workspaces */}
      <Modal
        open={Boolean(selectedProject)}
        onCancel={() => setSelectedProject(null)}
        footer={null}
        width={680}
        title={
          <div className="flex items-center gap-2">
            <FolderOpenOutlined className="text-blue-600" />
            <span>{selectedProject?.project_name}</span>
          </div>
        }
      >
        {loadingProjectDetail ? (
          <div className="py-12 flex justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              {projectDetailData?.data?.data?.description || t("noDescription", "No description provided.")}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 mb-5">
              <span>{t("owner", "Owner")}: <strong className="text-slate-700">{projectDetailData?.data?.data?.owner}</strong></span>
              <span>•</span>
              <span>{t("createdOn", "Created")}: {formatDate(projectDetailData?.data?.data?.created_at, currentLanguage)}</span>
            </div>

            <Divider className="my-4" />

            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <DatabaseOutlined className="text-blue-600" />
              {t("publicWorkspacesInProject", "Public Workspaces in this Project")}
            </h4>

            {(!Array.isArray(projectDetailData?.data?.data?.workspaces) || projectDetailData.data.data.workspaces.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                {t("noPublicWorkspacesInProject", "No public workspaces in this project yet.")}
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {projectDetailData.data.data.workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className="p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{ws.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {ws.layer_count || 0} {t("layersCount", "layers")} • {formatDate(ws.created_at, currentLanguage)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => setSelectedWorkspace(ws)}
                        className="text-xs"
                      >
                        {t("preview", "Preview")}
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleOpenClone(ws)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                      >
                        {t("clone", "Clone")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal: Inspect Workspace Layers */}
      <Modal
        open={Boolean(selectedWorkspace) && !cloneModalOpen}
        onCancel={() => setSelectedWorkspace(null)}
        footer={null}
        width={600}
        title={
          <div className="flex items-center gap-2">
            <DatabaseOutlined className="text-emerald-600" />
            <span>{t("project", "Workspace")}: {selectedWorkspace?.name}</span>
          </div>
        }
      >
        {loadingWorkspaceLayers ? (
          <div className="py-12 flex justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-500">
                {t("totalLayersInWs", "Total Layers")}:{" "}
                <strong className="text-slate-800">
                  {workspaceLayersData?.data?.pagination?.total || 0}
                </strong>
              </span>

              <Button
                type="primary"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => setCloneModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-xs"
              >
                {t("cloneThisWorkspace", "Clone this Workspace")}
              </Button>
            </div>

            {(!Array.isArray(workspaceLayersData?.data?.data) || workspaceLayersData.data.data.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                {t("noLayersInPublicWs", "No layers in this public workspace yet.")}
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {workspaceLayersData.data.data.map((layer) => (
                  <div
                    key={layer.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{layer.layer_name}</div>
                      <div className="text-slate-400 mt-0.5">{formatDate(layer.created_at, currentLanguage)}</div>
                    </div>
                    {layer.layer_type && (
                      <Tag color="cyan" className="font-mono text-[11px] uppercase">
                        {layer.layer_type}
                      </Tag>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal: Clone Workspace to User Project */}
      <Modal
        open={cloneModalOpen}
        onCancel={() => setCloneModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <CopyOutlined className="text-emerald-600" />
            <span>{t("cloneWorkspaceTitle", "Clone Workspace to Your Project")}</span>
          </div>
        }
        onOk={handleConfirmClone}
        okText={t("confirmCloneBtn", "Clone Now")}
        cancelText={t("cancel", "Cancel")}
        okButtonProps={{
          loading: cloneMutation.isPending,
          className: "bg-emerald-600 hover:bg-emerald-500",
        }}
      >
        <div className="py-2 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {t(
              "cloneModalDesc",
              "Copy this public workspace along with all its layers and default style configurations into one of your projects. The cloned workspace will automatically be Private in your account."
            )}
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("targetProject", "Target Project")} *
            </label>
            <Select
              className="w-full"
              placeholder={t("selectTargetProjectPlaceholder", "Select your project...")}
              value={targetProjectId}
              onChange={(val) => setTargetProjectId(val)}
              options={
                Array.isArray(userProjectsData?.data?.data)
                  ? userProjectsData.data.data.map((p) => ({
                      value: p.id,
                      label: `${p.project_name} (${p.visibility || "private"})`,
                    }))
                  : []
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("clonedWorkspaceName", "New Workspace Name")}
            </label>
            <Input
              value={cloneWorkspaceName}
              onChange={(e) => setCloneWorkspaceName(e.target.value)}
              placeholder="e.g. My Cloned Workspace"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PublicHub;
