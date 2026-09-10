import axiosClient from "./AxiosClient";

const workspaceApi = {
    getAll: () => {return axiosClient.get("/workspace/all")},
    getRecently: (id) => {return axiosClient.get(`/workspace/recently/${id}`)},
    list: (id, params) => {return axiosClient.get(`/workspace/list/${id}`, {params})},
    create: (id, data) => {
        return axiosClient.post(
            `/workspace/create/${id}`,
            data,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            }
        )
    },
    delete: (id) => {
        return axiosClient.delete(`/workspace/delete/${id}`)
    },
    detail: (id) => {
        return axiosClient.get(`/workspace/${id}`)
    },
    saveDefaultStyle: (id, data) => {
        return axiosClient.post(`/workspace/style/${id}`, data)
    }
}

export default workspaceApi