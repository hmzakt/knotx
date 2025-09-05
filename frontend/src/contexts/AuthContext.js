import { useState, useContext, createContext, useEffect } from "react";
import { getToken, removeToken } from "../lib/auth";
import apiClient from "../lib/api";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({children}){
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = (userData, token) => {
        setUser(userData);
        if(typeof window !== 'undefined'){
            localStorage.setItem('token', token)
        }
    };

    const logout = () => {
        setUser(null);
        removeToken();
    };

    //checking if user is already logged in
    useEffect(() => {
        async function loadUserFromToken(){
            const token = getToken();
            if(token){
                try{
                    const response = await apiClient.get('/user/current-user');
                    setUser(response.data.data); // Backend returns data in response.data.data
                }
                catch(error){
                    console.error('Error loading user', error);
                    removeToken();
                }
            }
            setLoading(false);
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
            {!loading && children}
        </AuthContext.Provider>
    );
}

