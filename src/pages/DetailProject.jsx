import { useState } from "react";
import { Typography, Button, Tabs, Spin } from "antd";
import {
    EditOutlined,
} from "@ant-design/icons";

import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Overview from "./Project/Overview";
import Workspace from "./Project/Workspace";
import ApiKeys from "./Project/ApiKeys";
import Activity from "./Project/Activity";
import Settings from "./Project/Settings";
import projectApi from "../api/ProjectApi";
import { useQuery } from "@tanstack/react-query";
import formatTanggal from "../utils/formatTanggal";
import ProjectModal from "../components/ProjectModal";
import BackButton from "../components/common/BackButton";
import { useLanguage } from "../context/LanguageContext";

const { Title, Text } = Typography;

const DetailProject = () => {
    const { t } = useLanguage()
    const navigate = useNavigate()
    const { id } = useParams()
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = searchParams.get("tab") || "overview"
    const [open, setOpen] = useState(false)

    const handleTabChange = (key) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev)
            next.set("tab", key)
            return next
        }, { replace: true })
    }

    const { data: project, isLoading, isError, error} = useQuery({
        queryKey: ["project", id],
        queryFn: () => projectApi.getById(id),
    })

    if(isLoading){
        return(
          <div className="min-h-screen flex justify-center items-center">
            <Spin size="large"/>
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

      const data = project?.data?.data

    return(
        <div className="p-4 sm:p-6 md:p-8">
            <BackButton fallbackTo="/dashboard/project" />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                    <Title level={2} className="!mb-1">
                        {data.project_name}
                    </Title>

                    <Text type="secondary">
                        {data.description}
                    </Text>

                    <br/>

                    <Text type="secondary">
                        {t('createdDate', 'Created')} {formatTanggal(data.created_at)}
                    </Text>
                </div>

                <Button
                    icon={<EditOutlined/>}
                    type="primary"
                    className="self-start sm:self-auto"
                    onClick={() => setOpen(true)}
                >
                    {t('editProject', 'Edit Project')}
                </Button>

            </div>

            <Tabs
                activeKey={activeTab}
                onChange={handleTabChange}
                items={[
                    {
                        key:"overview",
                        label: t('tabOverview', 'Overview'),
                        children:(
                            <Overview
                                id = {data.id}
                                workspace_count = {data.workspace_count}
                                api_key_count = {data.api_key_count}
                                layer_count = {data.layer_count}
                            />
                        )
                    },
                    {
                        key:"workspace",
                        label: t('tabWorkspace', 'Workspace'),
                        children:(
                            <Workspace
                                id = {data.id}
                            />
                        )
                    },
                    {
                        key:"apikey",
                        label: t('tabApiKeys', 'API Keys'),
                        children:(
                            <ApiKeys
                                id = {data.id}
                            />
                        )
                    },
                    {
                        key:"activity",
                        label: t('tabActivity', 'Activity'),
                        children:(
                            <Activity id={data.id}/>
                        )
                    },
                    {
                        key:"setting",
                        label: t('tabSettings', 'Settings'),
                        children:(
                            <Settings
                                id={data.id}
                                projectName={data.project_name}
                                description={data.description}
                            />
                        )
                    }
                ]}
            />

            <ProjectModal
              open={open}
              onClose={()=>setOpen(false)}
              mode={"edit"}
              project={data}
            />
        </div>
    )
}

export default DetailProject;