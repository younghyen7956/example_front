// src/utility/axiosInstance.ts
import axios, { AxiosInstance } from 'axios'

const HOST = process.env.VUE_APP_FASTAPI_HOST || 'localhost'
const PORT = process.env.VUE_APP_FASTAPI_PORT || '3333'

const fastapiAxiosInst: AxiosInstance = axios.create({
  baseURL: `http://${HOST}:${PORT}`,  // <-- env 기반 URL
  timeout: 10000
})

export default fastapiAxiosInst
