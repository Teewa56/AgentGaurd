import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Payment modal state management
let paymentModalCallback: ((details: any) => void) | null = null;

export function setPaymentModalHandler(callback: (details: any) => void) {
    paymentModalCallback = callback;
}

const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Cookies.get('accessToken')}`,
    },
});

api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as any;

        // Handle 402 Payment Required
        if (error.response?.status === 402) {
            const paymentDetails = (error.response.data as any)?.payment;

            if (paymentDetails && paymentModalCallback) {
                const callback = paymentModalCallback;
                // Show payment modal
                return new Promise((resolve, reject) => {
                    callback({
                        ...paymentDetails,
                        onComplete: async () => {
                            // Retry the original request after payment
                            if (originalRequest && !originalRequest._retry) {
                                originalRequest._retry = true;
                                try {
                                    const response = await api(originalRequest);
                                    resolve(response);
                                } catch (retryError) {
                                    reject(retryError);
                                }
                            } else {
                                reject(error);
                            }
                        },
                        onCancel: () => {
                            reject(error);
                        }
                    });
                });
            }
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
            originalRequest._retry = true;

            try {
                const { data } = await api.post(`/auth/refresh`);

                Cookies.set('accessToken', data.accessToken, { secure: true, sameSite: 'none' });

                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
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
