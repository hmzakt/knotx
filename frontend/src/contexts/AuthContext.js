"use client"
import { useState, useContext, createContext, useEffect } from "react";
import { getToken, removeToken, setToken } from "../lib/auth";
import apiClient from "../lib/api";

const AuthContext = createContext();

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({children}){
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = (userData, token) => {
        setUser(userData);
        if (token) {
            setToken(token); // Use the proper setToken function
        }
    };

    const logout = () => {
        setUser(null);
        removeToken();
    };

    //checking if user is already logged in
    useEffect(() => {
        async function loadUserFromToken(){
            try{
                const token = getToken();
                if (!token) {
                    setLoading(false);
                    return;
                }
                
                const response = await apiClient.get('/users/current-user');
                setUser(response.data.data); 
            }
            catch(error){
                console.error('Error loading user', error);
                // Clear any local token if it exists
                removeToken();
                setUser(null);
            }
            finally {
                setLoading(false);
            }
        }
        loadUserFromToken()
    }, [])

    const value = {
        user,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

