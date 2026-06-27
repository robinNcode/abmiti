// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { AppColors } from '../core/constants/colors';
import { RootStackParamList, Routes } from '../core/constants/routes';

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<LoginNavigationProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const { login, isLoading, error, clearError } = useAuthStore();

    const handleLogin = async () => {
        if (!email || !password) return;
        try {
            let response = await login({ email, password });
            console.log(response);

            // authStore state changes to isAuthenticated = true,
            // RootNavigator will automatically swap to HomeScreen
        } catch {
            // Error handled by store, visible below
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome back</Text>
                    <Text style={styles.subtitle}>Enter your details to sign in</Text>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <View style={styles.form}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="john@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={(v) => { setEmail(v); clearError(); }}
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        secureTextEntry
                        value={password}
                        onChangeText={(v) => { setPassword(v); clearError(); }}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator color={AppColors.white} />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.footer}
                    onPress={() => navigation.navigate(Routes.Register)}
                >
                    <Text style={styles.footerText}>Don't have an account? <Text style={styles.link}>Sign up</Text></Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: AppColors.paperMist,
    },
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: AppColors.ink,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: AppColors.muted,
    },
    errorText: {
        color: AppColors.error,
        marginBottom: 16,
        textAlign: 'center',
    },
    form: {
        gap: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: AppColors.ink,
        marginBottom: -8,
    },
    input: {
        backgroundColor: AppColors.white,
        borderWidth: 1,
        borderColor: AppColors.border,
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        color: AppColors.ink,
    },
    button: {
        backgroundColor: AppColors.terra,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: AppColors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        color: AppColors.muted,
    },
    link: {
        color: AppColors.terra,
        fontWeight: 'bold',
    },
});
