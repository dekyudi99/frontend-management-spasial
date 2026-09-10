import React from "react";
import {
    Card,
    Typography,
    Tag,
    Space,
    Dropdown,
    Button,
    Modal
} from "antd";
import {
    DatabaseOutlined,
    FolderOpenOutlined,
    KeyOutlined,
    MoreOutlined,
    EditOutlined,
    DeleteOutlined
} from "@ant-design/icons";
import {
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import formatTanggal from "../utils/formatTanggal";

const {Title,Text}=Typography;

const ProjectCard = ({project, onManage, onEdit, onDelete})=>{

    const items=[

        {
            key:"edit",
            label:"Edit",
            icon:<EditOutlined/>,
            onClick:onEdit
        },

        {
            key:"delete",
            label:"Delete",
            danger:true,
            icon:<DeleteOutlined/>,
            onClick: () => Modal.confirm({
                title: "Delete Project!",
                icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />,
                content: `Are you sure you want to delete project ${project.project_name}?`,
                okText: "Delete",
                cancelText: "Cancel",
                okType: "danger",
                onOk() {
                    onDelete()
                },
            })
        }

    ]

    return(

        <Card
            hoverable
            title={project.project_name}
            extra={
                <Dropdown
                    menu={{items}}
                    trigger={["click"]}
                >
                    <MoreOutlined className="text-lg cursor-pointer"/>
                </Dropdown>
            }
        >
            <Space direction="vertical">
                {/* <Title level={4}>
                    {project.project_name}
                </Title> */}

                <Text type="secondary">
                    {project.description}
                </Text>

                <div className="flex gap-2 flex-wrap">
                    <Tag color="blue" icon={<DatabaseOutlined/>}>
                        {project.workspace_count} Workspace
                    </Tag>

                    <Tag color="green" icon={<KeyOutlined/>}>
                        {project.api_key_count} API Key
                    </Tag>

                    <Tag icon={<FolderOpenOutlined/>}>
                        {formatTanggal(project.created_at)}
                    </Tag>
                </div>

                <Link to={`/dashboard/project/detail/${project.id}`}>    
                    <Button
                        type="primary"
                        onClick={onManage}
                    >
                        Manage
                    </Button>
                </Link>
            </Space>
        </Card>
    )
}

export default ProjectCard;