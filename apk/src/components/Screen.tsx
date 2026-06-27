import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../core/constants/colors';
import { OfflineBanner } from './OfflineBanner';

export const Screen: React.FC<React.PropsWithChildren<{ style?: StyleProp<ViewStyle> }>> = ({ children, style }) => (
    <SafeAreaView style={[styles.safeArea, style]} edges={['top', 'left', 'right']}>
        <OfflineBanner />
        {children}
    </SafeAreaView>
);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: AppColors.paperMist,
    },
});

