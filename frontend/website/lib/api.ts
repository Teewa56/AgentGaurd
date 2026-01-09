import axios from 'axios';
import Cookies from 'js-cookie';

// Use environment variable for API URL, default to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; // Backend is passing 3000 in server.ts now

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for sending/receiving HttpOnly cookies (RefreshToken)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Access Token if available
api.interceptors.request.use(
    (config) => {
        // We will store the short-lived access token in memory or a non-httpOnly cookie for convenience if needed, 
        // but strict security suggests memory. For this implementation, we'll try to get it from a managed store 
        // or let the user pass it. For now, let's assume we might store it in a cookie for persistence across simple reloads 
        // OR we rely on the AuthContext to inject it. 
        // BETTER PATTERN: Let AuthContext handle the token injection or use a variable.
        // For simplicity in this step, we'll check a cookie named 'accessToken' (if we choose to store it there) 
        // OR we can rely on the backend cookie if we changed the design. 
        // Backend design: sends accessToken in JSON, refreshToken in Cookie.
        // So we need to store accessToken.
        const token = Cookies.get('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 (Refresh Token Flow)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Call refresh endpoint
                // Note: This relies on the httpOnly cookie being present
                const { data } = await api.post('/auth/refresh');

                // Save new access token
                Cookies.set('accessToken', data.accessToken, { secure: true, sameSite: 'strict' });

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed - logout user
                Cookies.remove('accessToken');
                if (typeof window !== 'undefined') {
                    window.location.href = '/auth/login';
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
