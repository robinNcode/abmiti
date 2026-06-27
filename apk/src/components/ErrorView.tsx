// src/components/ErrorView.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppColors } from '../core/constants/colors';

interface Props {
    message: string;
    onRetry?: () => void;
}

export const ErrorView: React.FC<Props> = ({ message, onRetry }) => {
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Something went wrong</Text>
                <Text style={styles.message}>{message}</Text>
                {onRetry && (
                    <TouchableOpacity style={styles.button} onPress={onRetry}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AppColors.paper,
        padding: 24,
    },
    card: {
        backgroundColor: AppColors.white,
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: AppColors.border,
        alignItems: 'center',
        shadowColor: AppColors.ink,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.ink,
        marginBottom: 12,
    },
    message: {
        fontSize: 14,
        color: AppColors.muted,
        textAlign: 'center',
        marginBottom: 24,
    },
    button: {
        backgroundColor: AppColors.terra,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: AppColors.white,
        fontWeight: '600',
        fontSize: 14,
    },
});
