// src/hooks/useNetwork.ts
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetwork = () => {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsOnline(!!state.isConnected && state.isInternetReachable !== false);
        });
        return () => unsubscribe();
    }, []);

    return { isOnline };
};
