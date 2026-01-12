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
            const token = Cookies.get('accessToken');
            const user = Cookies.get('user');

            if (token) {
                try {
                    user ? setUser(JSON.parse(user)) : setUser(null);
                } catch (e) {
                    console.error("Failed to parse user data", e);
                    Cookies.remove('accessToken');
                }
            }
            setLoading(false);
        };

        initAuth(); 
    }, []);

    const login = (token: string, userData: User) => {
        Cookies.set('accessToken', token, { secure: true, sameSite: 'strict', expires: 1 });
        Cookies.set('user', JSON.stringify(userData), { secure: true, sameSite: 'strict', expires: 7 });
        setUser(userData);
        router.push('/dashboard');
    };

    const logout = () => {
        Cookies.remove('accessToken');
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
