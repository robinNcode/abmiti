// src/app/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from '../../store/authStore';
import { SplashScreen } from '../../screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { Routes, RootStackParamList } from '../../core/constants/routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuthStore();

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
                {isLoading ? (
                    // Still hydrating token
                    <Stack.Screen name={Routes.Splash} component={SplashScreen} />
                ) : isAuthenticated ? (
                    // Logged in
                    <Stack.Screen name={Routes.MainRoot} component={MainNavigator} />
                ) : (
                    // Not logged in
                    <Stack.Screen name={Routes.AuthRoot} component={AuthNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
