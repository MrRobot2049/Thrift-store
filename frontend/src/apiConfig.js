const DEPLOYED_BACKEND_URL = "https://thrift-store-5u43.onrender.com";

export const API_BASE_URL = `${DEPLOYED_BACKEND_URL}/api`;
export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
