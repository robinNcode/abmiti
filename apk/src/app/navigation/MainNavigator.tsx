import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../core/constants/colors';
import type { EntryType } from '../../models/common';
import { AccountsScreen } from '../../screens/AccountsScreen';
import { AddEntryScreen } from '../../screens/AddEntryScreen';
import { AnalyticsScreen } from '../../screens/AnalyticsScreen';
import { CategoriesScreen } from '../../screens/CategoriesScreen';
import { DashboardScreen } from '../../screens/DashboardScreen';
import { EntriesScreen } from '../../screens/EntriesScreen';
import { ProfileScreen } from '../../screens/ProfileScreen';

type TabKey = 'dashboard' | 'entries' | 'analytics' | 'categories' | 'accounts' | 'profile';

const tabs: { key: TabKey; label: string }[] = [
    { key: 'dashboard', label: 'Home' },
    { key: 'entries', label: 'Entries' },
    { key: 'analytics', label: 'Stats' },
    { key: 'categories', label: 'Cats' },
    { key: 'accounts', label: 'Accounts' },
    { key: 'profile', label: 'Me' },
];

export const MainNavigator: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
    const [addingType, setAddingType] = useState<EntryType | undefined>();

    if (addingType) {
        return <AddEntryScreen initialType={addingType} onDone={() => { setAddingType(undefined); setActiveTab('entries'); }} />;
    }

    const renderScreen = () => {
        if (activeTab === 'dashboard') return <DashboardScreen />;
        if (activeTab === 'entries') return <EntriesScreen onAdd={(type = 'expense') => setAddingType(type)} />;
        if (activeTab === 'analytics') return <AnalyticsScreen />;
        if (activeTab === 'categories') return <CategoriesScreen />;
        if (activeTab === 'accounts') return <AccountsScreen />;
        return <ProfileScreen />;
    };

    return (
        <View style={styles.shell}>
            {renderScreen()}
            <View style={styles.tabs}>
                {tabs.map((tab) => {
                    const active = tab.key === activeTab;
                    return (
                        <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={styles.tab}>
                            <View style={[styles.tabDot, active && styles.tabDotActive]} />
                            <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>{tab.label}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    shell: { flex: 1, backgroundColor: AppColors.paperMist },
    tabs: {
        position: 'absolute',
        left: 10,
        right: 10,
        bottom: 10,
        minHeight: 64,
        borderRadius: 8,
        backgroundColor: AppColors.white,
        borderWidth: 1,
        borderColor: AppColors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 4,
        elevation: 8,
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 54 },
    tabDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
    tabDotActive: { backgroundColor: AppColors.terra },
    tabText: { color: AppColors.muted, fontSize: 11, fontWeight: '800' },
    tabTextActive: { color: AppColors.ink },
});
