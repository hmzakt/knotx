//set up the naseurl to backend and ensure jwt is attached to every ruquest
import axios from 'axios';

// request interceptor
const apiClient = axios.create({
    baseURL : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
    withCredentials: true 
});

apiClient.interceptors.request.use(
    (config) => {
        
const token = localStorage.getItem('token') // rename it later
        if(token){
            config.headers.Authorization = `Bearer ${token}`
        }
        return config;        
    },
    (error) =>{
        return Promise.reject(error);
    }
);

// response interceptor
apiClient.interceptors.response.use(
    (response)=>response, 
    (error) =>{
        if(error.response?.status == 401){
            // Clear any local token if it exists
            localStorage.removeItem('token');
            // Only redirect if we're not already on login page and not on home page to prevent loops
            if (typeof window !== 'undefined' && 
                !window.location.pathname.includes('/login') && 
                !window.location.pathname.includes('/register') &&
                window.location.pathname !== '/') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
