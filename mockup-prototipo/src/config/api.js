const RAW_API_URL = import.meta.env.VITE_API_URL || '/api'

const normalized = RAW_API_URL.startsWith('/')
  ? RAW_API_URL
  : RAW_API_URL.startsWith('http://') || RAW_API_URL.startsWith('https://')
    ? RAW_API_URL
    : `https://${RAW_API_URL}`

export const API_URL = normalized.replace(/\/$/, '')
