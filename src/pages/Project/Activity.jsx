import React, { useEffect, useRef } from 'react'
import { Timeline, Card, Tag, Spin, Button, Empty, Tooltip } from 'antd'
import { useParams } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import projectApi from '../../api/ProjectApi'
import formatTanggal from '../../utils/formatTanggal'
import {
    Activity as ActivityIcon,
    RefreshCw,
    FolderPlus,
    Edit3,
    Database,
    Key,
    Layers,
    Trash2,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Shield,
    ChevronDown
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const appName = import.meta.env.VITE_APP_NAME || "AstraGIS"

const Activity = ({ id }) => {
    const { t } = useLanguage()
    const params = useParams()
    const projectId = id || params?.id
    const loadMoreRef = useRef(null)

    useEffect(() => {
        document.title = `Project Activities | ${appName}`
    }, [])

    const {
        data: logsData,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isFetching
    } = useInfiniteQuery({
        queryKey: ["projectLogs", projectId],
        queryFn: ({ pageParam = 1 }) => projectApi.getLogs(projectId, { page: pageParam, size: 10 }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const pagination = lastPage?.data?.pagination
            if (pagination && pagination.page < pagination.total_pages) {
                return pagination.page + 1
            }
            return undefined
        },
        enabled: !!projectId
    })

    // Infinite scroll observer: trigger fetchNextPage saat scroll mencapai sentinel bawah
    useEffect(() => {
        if (!hasNextPage || isFetchingNextPage) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchNextPage()
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        )

        const currentRef = loadMoreRef.current
        if (currentRef) {
            observer.observe(currentRef)
        }

        return () => {
            if (currentRef) observer.unobserve(currentRef)
            observer.disconnect()
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const logs = logsData?.pages?.flatMap(page => page?.data?.data || []) || []

    // Helper untuk memformat action log menjadi tampilan yang ramah pengguna
    const getActionConfig = (action, status) => {
        const isSuccess = status === "SUCCESS"
        switch (action) {
            case "PROJECT_CREATE":
                return {
                    label: t('actProjectCreate', "Project Dibuat"),
                    color: "blue",
                    icon: <FolderPlus className="w-4 h-4 text-blue-600" />
                }
            case "PROJECT_UPDATE":
                return {
                    label: t('actProjectUpdate', "Project Diperbarui"),
                    color: "blue",
                    icon: <Edit3 className="w-4 h-4 text-blue-600" />
                }
            case "WORKSPACE_CREATE":
                return {
                    label: t('actWorkspaceCreate', "Workspace Dibuat"),
                    color: "teal",
                    icon: <Database className="w-4 h-4 text-teal-600" />
                }
            case "WORKSPACE_DELETE":
                return {
                    label: t('actWorkspaceDelete', "Workspace Dihapus"),
                    color: "red",
                    icon: <Trash2 className="w-4 h-4 text-red-500" />
                }
            case "API_KEY_CREATE":
                return {
                    label: t('actApiKeyCreate', "API Key Dibuat"),
                    color: "amber",
                    icon: <Key className="w-4 h-4 text-amber-600" />
                }
            case "API_KEY_DELETE":
                return {
                    label: t('actApiKeyDelete', "API Key Dihapus"),
                    color: "red",
                    icon: <Trash2 className="w-4 h-4 text-red-500" />
                }
            case "LAYER_PUBLISH":
            case "S2S_PUBLISH_FILE":
            case "S2S_PUBLISH_URL":
                return {
                    label: t('actLayerPublish', "Layer Dipublikasikan"),
                    color: "green",
                    icon: <Layers className="w-4 h-4 text-emerald-600" />
                }
            case "LAYER_DELETE":
                return {
                    label: t('actLayerDelete', "Layer Dihapus"),
                    color: "red",
                    icon: <Trash2 className="w-4 h-4 text-red-500" />
                }
            default:
                return {
                    label: action.replace(/_/g, ' '),
                    color: isSuccess ? "blue" : "red",
                    icon: <ActivityIcon className="w-4 h-4 text-slate-500" />
                }
        }
    }

    if (isLoading) {
        return (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Spin size="large" />
                <p className="text-sm">Memuat log aktivitas project...</p>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center justify-between">
                <span>{error?.response?.data?.detail || "Gagal memuat log aktivitas project."}</span>
                <Button size="small" onClick={() => refetch()} className="border-red-300 text-red-700">
                    Coba Lagi
                </Button>
            </div>
        )
    }

    return (
        <Card
            className="shadow-xs border border-slate-200/80 rounded-2xl overflow-hidden"
            title={
                <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                            <ActivityIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 m-0">{t('activityTitle', 'Riwayat Aktivitas Project')}</h3>
                            <p className="text-xs text-slate-400 font-normal m-0">{t('activitySubtitle', 'Catatan log aktivitas dan audit pada project ini')}</p>
                        </div>
                    </div>

                    <Button
                        type="text"
                        size="small"
                        icon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="text-slate-500 hover:text-teal-600 cursor-pointer flex items-center gap-1"
                    >
                        {t('refresh', 'Refresh')}
                    </Button>
                </div>
            }
        >
            {logs.length > 0 ? (
                <div className="py-2 max-h-[600px] overflow-y-auto pr-3 scroll-smooth">
                    <Timeline
                        mode="left"
                        items={logs.map((log) => {
                            const config = getActionConfig(log.action, log.status)
                            const isSuccess = log.status === "SUCCESS"

                            return {
                                dot: (
                                    <div className="p-1 rounded-full bg-slate-50 border border-slate-200 shadow-2xs">
                                        {config.icon}
                                    </div>
                                ),
                                children: (
                                    <div className="pb-4">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800 text-sm">
                                                {config.label}
                                            </span>

                                            {log.resource_name && (
                                                <Tag className="rounded-md font-mono text-xs border-slate-200 bg-slate-50 text-slate-700">
                                                    {log.resource_name}
                                                </Tag>
                                            )}

                                            <Tag
                                                color={isSuccess ? "success" : "error"}
                                                className="rounded-full text-[11px] font-semibold"
                                            >
                                                {isSuccess ? t('statusSuccess', "Success") : t('statusFailed', "Failed")}
                                            </Tag>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                                            <span className="flex items-center gap-1 text-slate-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatTanggal(log.created_at)}
                                            </span>

                                            {log.client_user_name && (
                                                <span className="flex items-center gap-1 text-slate-500">
                                                    <User className="w-3.5 h-3.5" />
                                                    {log.client_user_name}
                                                </span>
                                            )}

                                            {log.auth_type && (
                                                <span className="flex items-center gap-1 text-slate-400">
                                                    <Shield className="w-3.5 h-3.5" />
                                                    {log.auth_type}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            }
                        })}
                    />

                    {/* Sentinel element for infinite scroll */}
                    <div ref={loadMoreRef} className="py-2 text-center">
                        {isFetchingNextPage ? (
                            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-3">
                                <Spin size="small" />
                                <span>{t('loadingMoreActivities', 'Memuat aktivitas lainnya...')}</span>
                            </div>
                        ) : hasNextPage ? (
                            <Button
                                size="small"
                                type="dashed"
                                onClick={() => fetchNextPage()}
                                className="text-xs text-slate-500 hover:text-teal-600 cursor-pointer"
                                icon={<ChevronDown className="w-3.5 h-3.5" />}
                            >
                                {t('loadMore', 'Muat Lebih Banyak')}
                            </Button>
                        ) : (
                            <p className="text-xs text-slate-400 py-2 border-t border-slate-100 mt-2">
                                {t('allActivitiesLoaded', 'Semua riwayat aktivitas telah ditampilkan.')}
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="py-12 text-center text-slate-400">
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<span className="text-slate-500 text-sm">{t('emptyActivity', 'Belum ada log aktivitas yang tercatat untuk project ini.')}</span>}
                    />
                </div>
            )}
        </Card>
    )
}

export default Activity