import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { AppColors } from '../core/constants/colors';

interface AppButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    disabled?: boolean;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
}

export const AppButton: React.FC<AppButtonProps> = ({ title, onPress, variant = 'primary', disabled, loading, style }) => (
    <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
            styles.base,
            styles[variant],
            (pressed || disabled) && styles.dimmed,
            style,
        ]}
    >
        {loading ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? AppColors.white : AppColors.terra} /> : (
            <Text style={[styles.text, variant === 'primary' || variant === 'danger' ? styles.lightText : styles.darkText]}>
                {title}
            </Text>
        )}
    </Pressable>
);

const styles = StyleSheet.create({
    base: {
        minHeight: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    primary: { backgroundColor: AppColors.terra },
    secondary: { backgroundColor: AppColors.paper, borderWidth: 1, borderColor: AppColors.border },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: AppColors.error },
    dimmed: { opacity: 0.65 },
    text: { fontSize: 15, fontWeight: '700' },
    lightText: { color: AppColors.white },
    darkText: { color: AppColors.ink },
});

