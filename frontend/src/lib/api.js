//set up the naseurl to backend and ensure jwt is attached to every ruquest
import axios from 'axios';

// request interceptor
const apiClient = axios.create({
    baseURL : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1',
    withCredentials: true 
});

apiClient.interceptors.request.use(
    (config) => {
        // Include bearer token when present (supports cases where cookies are not sent)
        try {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers = config.headers || {};
                    if (!config.headers.Authorization) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
            }
        } catch {}

        // Prefer HTTP-only Secure cookies as primary; above bearer is a fallback.
        // Guard against mixed content in production
        if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
            const base = (config.baseURL || '').toString();
            if (base.startsWith('http://')) {
                // Attempt to auto-upgrade to https version of same host
                try {
                    const url = new URL(base);
                    url.protocol = 'https:';
                    config.baseURL = url.toString();
                } catch {}
            }
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
            // With cookie-based auth, simply redirect without touching storage
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
