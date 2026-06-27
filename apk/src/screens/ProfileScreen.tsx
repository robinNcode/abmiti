import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Screen } from '../components/Screen';
import { AppColors } from '../core/constants/colors';
import { useAuthStore } from '../store/authStore';

export const ProfileScreen: React.FC = () => {
    const { user, logout, isLoading } = useAuthStore();

    return (
        <Screen>
            <View style={styles.content}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.name?.slice(0, 1).toUpperCase() ?? 'A'}</Text>
                </View>
                <Text style={styles.name}>{user?.name ?? 'Abmiti User'}</Text>
                <Text style={styles.email}>{user?.email}</Text>

                <View style={styles.panel}>
                    <Text style={styles.panelTitle}>Monthly Budget</Text>
                    <Text style={styles.budget}>{typeof user?.budget === 'number' ? user.budget : 0}</Text>
                </View>

                <AppButton title="Log Out" variant="danger" loading={isLoading} onPress={logout} />
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    content: { flex: 1, padding: 16, gap: 14, justifyContent: 'center' },
    avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: AppColors.terra, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
    avatarText: { color: AppColors.white, fontSize: 34, fontWeight: '900' },
    name: { color: AppColors.ink, fontSize: 26, fontWeight: '900', textAlign: 'center' },
    email: { color: AppColors.muted, textAlign: 'center' },
    panel: { backgroundColor: AppColors.white, borderRadius: 8, borderWidth: 1, borderColor: AppColors.border, padding: 16, alignItems: 'center' },
    panelTitle: { color: AppColors.muted, fontWeight: '800', textTransform: 'uppercase', fontSize: 12 },
    budget: { color: AppColors.ink, fontSize: 28, fontWeight: '900', marginTop: 4 },
});

