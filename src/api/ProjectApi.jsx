import axiosClient from "./AxiosClient"

const projectApi = {
    getall: (params) => {return axiosClient.get("/project", { params })},
    create: (data) => {
        return axiosClient.post(
            "/project",
            data,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            },
        )
    },
    update: (id, data) => {
        return axiosClient.put(
            `/project/${id}`,
            data,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            },
        )
    },
    getById: (id) => {
        return axiosClient.get(`/project/${id}`)
    },
    delete: (id) => {
        return axiosClient.delete(`/project/${id}`)
    }
}

export default projectApi