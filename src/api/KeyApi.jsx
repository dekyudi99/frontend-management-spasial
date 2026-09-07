import axiosClient from "./AxiosClient";

const keyApi = {
    get: (id) => {
        return axiosClient.get(`/api-key/${id}`)
    },
    create: (project_id, data) => {
        return axiosClient.post(
            `/api-key/${project_id}`,
            data,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            }
        )
    },
    delete: (id) => {
        return axiosClient.delete(`/api-key/${id}`)
    }
}

export default keyApi