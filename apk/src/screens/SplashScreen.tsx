// src/screens/SplashScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { AppColors } from '../core/constants/colors';

export const SplashScreen: React.FC = () => {
    const hydrate = useAuthStore((state) => state.hydrate);

    useEffect(() => {
        // Show splash for at least a brief moment, and hydrate store
        const timer = setTimeout(() => {
            hydrate();
        }, 1000);

        return () => clearTimeout(timer);
    }, [hydrate]);

    return (
        <View style={styles.container}>
            {/* Fallback text since we don't have local image assets right now */}
            <Text style={styles.title}>Abmiti</Text>
            <Text style={styles.subtitle}>Personal Finance Tracker</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.paperMist,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: AppColors.terra,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: AppColors.ink,
        opacity: 0.7,
        marginTop: 8,
    },
});
