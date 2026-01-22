'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: () => { },
    logout: () => { },
    isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initAuth = async () => {
            const isLoggedIn = Cookies.get('isLoggedIn');
            const userStr = Cookies.get('user');

            if (isLoggedIn && userStr) {
                try {
                    setUser(JSON.parse(userStr));
                } catch (e) {
                    console.error("Failed to parse user data", e);
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = (token: string, userData: User) => {
        // Token is now set via httpOnly cookie from backend, but we keep this signature for compatibility
        // or for cases where we might still need it (e.g. mobile apps).
        // For web, we rely on the backend setting 'accessToken' cookie.
        Cookies.set('isLoggedIn', 'true', { secure: true, sameSite: 'none', expires: 1 });
        Cookies.set('user', JSON.stringify(userData), { secure: true, sameSite: 'none', expires: 7 });
        setUser(userData);
        router.push('/dashboard');
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error("Logout request failed", e);
        }
        Cookies.remove('isLoggedIn');
        Cookies.remove('user');
        setUser(null);
        router.push('/auth/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
