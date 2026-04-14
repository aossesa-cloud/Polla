const RAW_API_URL = import.meta.env.VITE_API_URL || '/api'

export const API_URL = RAW_API_URL.replace(/\/$/, '')
