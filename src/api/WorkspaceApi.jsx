import axiosClient from "./AxiosClient";

const workspaceApi = {
    getAll: () => {return axiosClient.get("/workspace/all")},
    getRecently: (id) => {return axiosClient.get(`/workspace/recently/${id}`)},
    list: (id, params) => {return axiosClient.get(`/workspace/list/${id}`, {params})},
    getall: (params) => {
        if (params && typeof params === 'object' && params.id) {
            const { id, ...rest } = params;
            return axiosClient.get(`/workspace/list/${id}`, { params: rest });
        }
        return axiosClient.get("/workspace/all");
    },
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
