import { useState } from "react";
import { Typography, Button, Tabs, Spin } from "antd";
import {
    ArrowLeftOutlined,
    EditOutlined,
} from "@ant-design/icons";

import { useNavigate, useParams } from "react-router-dom";
import Overview from "./Project/Overview";
import Workspace from "./Project/Workspace";
import ApiKeys from "./Project/ApiKeys";
import Activity from "./Project/Activity";
import Settings from "./Project/Settings";
import projectApi from "../api/ProjectApi";
import { useQuery } from "@tanstack/react-query";
import formatTanggal from "../utils/formatTanggal";
import ProjectModal from "../components/ProjectModal";

const { Title, Text } = Typography;

const DetailProject = () => {

    const navigate = useNavigate()
    const { id } = useParams()
    const [open, setOpen] = useState(false)

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
        <div className="p-8">
            <Button
                icon={<ArrowLeftOutlined/>}
                type="link"
                onClick={()=>navigate(-1)}
                className="-m-3"
            >
                Back
            </Button>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <Title level={2}>
                        {data.project_name}
                    </Title>

                    <Text type="secondary">
                        {data.description}
                    </Text>

                    <br/>

                    <Text type="secondary">
                        Created {formatTanggal(data.created_at)}
                    </Text>
                </div>

                <Button
                    icon={<EditOutlined/>}
                    type="primary"
                    onClick={() => setOpen(true)}
                >
                    Edit Project
                </Button>

            </div>

            <Tabs
                items={[
                    {
                        key:"overview",
                        label:"Overview",
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
                        label:"Workspace",
                        children:(
                            <Workspace
                                id = {data.id}
                            />
                        )
                    },
                    {
                        key:"apikey",
                        label:"API Keys",
                        children:(
                            <ApiKeys
                                id = {data.id}
                            />
                        )
                    },
                    {
                        key:"activity",
                        label:"Activity",
                        children:(
                            <Activity/>
                        )
                    },
                    {

                        key:"setting",
                        label:"Settings",
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