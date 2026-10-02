import axios from "axios";
import { ensureS2SKey } from "./WorkspaceApi";
import { MICROSERVICE_API } from "./microserviceConfig";

const getAuthHeaders = async (isMultipart = false) => {
  const key = await ensureS2SKey();
  const headers = {
    "X-API-Key": key,
  };
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

const ingestApi = {
  /**
   * Upload berkas spasial dari perangkat lokal ke background worker
   * @param {FormData} formData - form data berisi file, workspace_name, layer_name, description
   */
  upload: async (formData) => {
    const headers = await getAuthHeaders(true);
    const res = await axios.post(`${MICROSERVICE_API}/ingest/uploads`, formData, { headers });
    return res.data;
  },

  /**
   * Upload banyak berkas spasial sekaligus (Batch Upload)
   * @param {FormData} formData - form data berisi files (array), workspace_name, display_names (JSON string array), description
   */
  batchUpload: async (formData) => {
    const headers = await getAuthHeaders(true);
    const res = await axios.post(`${MICROSERVICE_API}/ingest/batch-uploads`, formData, { headers });
    return res.data;
  },

  /**
   * Mengecek status sekumpulan job ingest sekaligus (Batch Status)
   * @param {string[]} jobIds - Array of job UUIDs
   */
  getBatchStatus: async (jobIds) => {
    const headers = await getAuthHeaders(false);
    const res = await axios.post(`${MICROSERVICE_API}/ingest/jobs/batch-status`, { job_ids: jobIds }, { headers });
    return res.data;
  },

  /**
   * Mengecek status progres pekerjaan ingest berdasarkan ID
   * @param {string} jobId
   */
  getJobStatus: async (jobId) => {
    const headers = await getAuthHeaders(false);
    const res = await axios.get(`${MICROSERVICE_API}/ingest/jobs/${jobId}`, { headers });
    return res.data;
  },

  /**
   * Mengambil riwayat daftar pekerjaan ingest milik user
   * @param {Object} params - { status, limit, offset }
   */
  listJobs: async (params = {}) => {
    const headers = await getAuthHeaders(false);
    const res = await axios.get(`${MICROSERVICE_API}/ingest/jobs`, { headers, params });
    return res.data;
  },
};

export default ingestApi;

