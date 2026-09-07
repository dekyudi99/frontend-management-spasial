import axiosClient from "./AxiosClient";

const layerApi = {
    create: (data) =>
        axiosClient.post(
            '/layer/publish-automated',
            data,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            }
        ),
    list: (params) =>
        axiosClient.get('/layer/list', { params }),
    updateStyle: (data) =>
        axiosClient.post('/layer/update-style', data),
    delete: (id) =>
        axiosClient.delete(`/layer/delete/${id}`),
}

export default layerApi
