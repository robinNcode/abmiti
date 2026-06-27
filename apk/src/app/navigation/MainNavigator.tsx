// src/app/navigation/MainNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../../screens/HomeScreen';
import { Routes, RootStackParamList } from '../../core/constants/routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const MainNavigator: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name={Routes.Home} component={HomeScreen} />
            {/* Additional native screens like Profile will be added here in future v2 */}
        </Stack.Navigator>
    );
};
