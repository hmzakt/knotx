"use client";
import { useState, useContext, createContext, useEffect } from "react";
import { getToken } from "../lib/auth";
import apiClient from "../lib/api";

const SubscriptionContext = createContext();

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}

export function SubscriptionProvider({ children }) {
    const [subscriptions, setSubscriptions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [initialized, setInitialized] = useState(false);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = getToken();
            if (!token) {
                setSubscriptions(null);
                return;
            }
            console.log('Fetching subscriptions...');
            const response = await apiClient.get('/users/subscriptions');
            console.log('Subscriptions response:', response.data);
            setSubscriptions(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch user subscriptions');
            console.error('Error fetching user subscriptions:', err);
            setSubscriptions(null);
        } finally {
            setLoading(false);
        }
    };

    const refetch = async () => {
        await fetchSubscriptions();
    };

    // Check if user is already logged in and fetch subscriptions
    useEffect(() => {
        async function loadSubscriptionsFromToken() {
            try {
                const token = getToken();
                if (!token) {
                    setLoading(false);
                    setSubscriptions(null);
                    setInitialized(true);
                    return;
                }
                
                await fetchSubscriptions();
                setInitialized(true);
            } catch (error) {
                console.error('Error loading subscriptions', error);
                setSubscriptions(null);
                setLoading(false);
                setInitialized(true);
            }
        }
        loadSubscriptionsFromToken();
    }, []);

    // Listen for token changes (login/logout) across tabs
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'token') {
                if (e.newValue) {
                    // Token added - fetch subscriptions
                    fetchSubscriptions();
                } else {
                    // Token removed - clear subscriptions
                    setSubscriptions(null);
                    setError(null);
                }
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('storage', handleStorage);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('storage', handleStorage);
            }
        };
    }, []);

    const value = {
        subscriptions,
        loading,
        error,
        refetch,
        initialized
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}
