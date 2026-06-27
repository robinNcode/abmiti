// src/components/AppLoader.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppColors } from '../core/constants/colors';

interface Props {
    fullScreen?: boolean;
}

export const AppLoader: React.FC<Props> = ({ fullScreen = true }) => {
    if (!fullScreen) {
        return <ActivityIndicator size="large" color={AppColors.terra} style={styles.inline} />;
    }
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={AppColors.terra} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AppColors.paperMist,
    },
    inline: {
        padding: 24,
    },
});
