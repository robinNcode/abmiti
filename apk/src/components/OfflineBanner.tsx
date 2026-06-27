// src/components/OfflineBanner.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppColors } from '../core/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../hooks/useNetwork';

export const OfflineBanner = () => {
    const { isOnline } = useNetwork();
    const insets = useSafeAreaInsets();

    if (isOnline) return null;

    return (
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 8) }]}>
            <Text style={styles.text}>No Internet Connection</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: AppColors.error,
        paddingBottom: 8,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    text: {
        color: AppColors.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
});
