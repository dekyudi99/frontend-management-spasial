import { useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Button, Empty, Typography } from 'antd'
import { DatabaseOutlined, GlobalOutlined, KeyOutlined, FolderOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import workspaceApi from '../../api/WorkspaceApi'
import formatTanggal from '../../utils/formatTanggal'
import { Link } from 'react-router-dom'
import { ArrowRight, Layers, Database, Key } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const appName = import.meta.env.VITE_APP_NAME || "AstraGIS"

const Overview = (props) => {
    const { t } = useLanguage()

    useEffect(() => {
        document.title = `Detail Project | ${appName}`
    }, [])

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["recentlyWorkspace", props.id],
        queryFn: () => workspaceApi.getRecently(props.id),
        enabled: !!props.id
    })

    if (isLoading) {
        return (
            <div className="py-12 flex justify-center items-center text-slate-500 text-sm">
                Loading recently workspace...
            </div>
        )
    }

    if (isError) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error?.response?.data?.detail || "Gagal memuat workspace terbaru."}
            </div>
        )
    }

    const workspaceColumns = [
        {
            title: t('columnWorkspace', "Workspace"),
            dataIndex: "name",
            render: (text) => (
                <div className="flex items-center gap-3 font-semibold text-slate-800 py-1">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                        <FolderOutlined className="text-sm" />
                    </div>
                    <span className="text-sm">{text}</span>
                </div>
            )
        },
        {
            title: t('columnLayers', "Layers"),
            dataIndex: "layer_count",
            render: (count) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/80">
                    {count ?? 0} {t('columnLayers', 'Layers')}
                </span>
            )
        },
        {
            title: t('columnCreatedAt', "Created At"),
            dataIndex: "created_at",
            render: (created) => (
                <span className="text-slate-500 text-xs sm:text-sm font-normal">
                    {formatTanggal(created)}
                </span>
            )
        },
        {
            title: t('columnAction', "Action"),
            render: (_, record) => (
                <Link
                    to={`/dashboard/project/detail/${props.id}/workspace/${record.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-semibold text-xs sm:text-sm transition-all"
                >
                    <span>{t('manage', 'Manage')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            )
        },
    ]

    const workspace = data?.data?.data || []

    return (
        <div className="space-y-8 pb-6">
            {/* 3 Statistics Cards: Workspace, Layers, API Keys */}
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={8}>
                    <Card className="shadow-xs border border-slate-200/80 rounded-2xl hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between p-1">
                            <Statistic
                                title={<span className="text-xs sm:text-sm font-semibold text-slate-500">{t('totalWorkspace', 'Total Workspace')}</span>}
                                value={props.workspace_count ?? 0}
                                valueStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                            />
                            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                                <Database className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                    <Card className="shadow-xs border border-slate-200/80 rounded-2xl hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between p-1">
                            <Statistic
                                title={<span className="text-xs sm:text-sm font-semibold text-slate-500">{t('totalLayers', 'Total Layers')}</span>}
                                value={props.layer_count ?? 0}
                                valueStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                            />
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Layers className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                    <Card className="shadow-xs border border-slate-200/80 rounded-2xl hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between p-1">
                            <Statistic
                                title={<span className="text-xs sm:text-sm font-semibold text-slate-500">{t('apiKeys', 'API Keys')}</span>}
                                value={props.api_key_count ?? 0}
                                valueStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                            />
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                <Key className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Recent Workspaces Card with Generous Spacing */}
            <Card
                className="shadow-xs border border-slate-200/80 rounded-2xl overflow-hidden mt-8"
                styles={{
                    header: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9' },
                    body: { padding: '8px 16px 20px 16px' }
                }}
                title={
                    <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shadow-2xs">
                                <FolderOutlined className="text-base" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800 m-0">{t('recentWorkspaces', 'Recent Workspaces')}</h3>
                            </div>
                        </div>
                    </div>
                }
            >
                <div className="overflow-x-auto">
                    <Table
                        pagination={false}
                        columns={workspaceColumns}
                        dataSource={workspace}
                        rowKey="id"
                        scroll={{ x: 550 }}
                        className="[&_.ant-table-thead_>_tr_>_th]:!bg-slate-50/70 [&_.ant-table-thead_>_tr_>_th]:!text-slate-600 [&_.ant-table-thead_>_tr_>_th]:!font-semibold [&_.ant-table-thead_>_tr_>_th]:!py-3.5 [&_.ant-table-tbody_>_tr_>_td]:!py-4 hover:[&_.ant-table-tbody_>_tr]:bg-slate-50/50"
                        locale={{
                            emptyText: (
                                <div className="py-12 text-center text-slate-400">
                                    <FolderOutlined className="text-4xl mb-2.5 text-slate-300" />
                                    <p className="text-sm font-medium text-slate-500">{t('emptyWorkspace', 'Belum ada workspace pada project ini.')}</p>
                                </div>
                            )
                        }}
                    />
                </div>
            </Card>
        </div>
    )
}

export default Overview