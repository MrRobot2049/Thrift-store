const DEPLOYED_BACKEND_URL = "https://thrift-store-5u43.onrender.com";

function normalizeApiBaseUrl(value) {
  const baseUrl = (value || DEPLOYED_BACKEND_URL).replace(/\/+$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(process.env.REACT_APP_API_BASE_URL);
export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
