import React from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { AppColors } from '../core/constants/colors';

interface AppTextFieldProps extends TextInputProps {
    label: string;
}

export const AppTextField: React.FC<AppTextFieldProps> = ({ label, style, ...props }) => (
    <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            {...props}
            placeholderTextColor="#9B948A"
            style={[styles.input, props.multiline && styles.multiline, style]}
        />
    </View>
);

const styles = StyleSheet.create({
    wrapper: { gap: 7 },
    label: { color: AppColors.ink, fontWeight: '700', fontSize: 13 },
    input: {
        minHeight: 46,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: AppColors.border,
        backgroundColor: AppColors.white,
        color: AppColors.ink,
        paddingHorizontal: 12,
        fontSize: 15,
    },
    multiline: {
        minHeight: 86,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
});

