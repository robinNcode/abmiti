import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { EntryListItem } from '../components/EntryListItem';
import { EntryTypeFilter } from '../components/EntryTypeFilter';
import { Screen } from '../components/Screen';
import { AppColors } from '../core/constants/colors';
import { ENTRY_TYPES, type EntryType } from '../models/common';
import { useEntryStore } from '../store/entryStore';

interface EntriesScreenProps {
    onAdd: (type?: EntryType) => void;
}

export const EntriesScreen: React.FC<EntriesScreenProps> = ({ onAdd }) => {
    const { entries, selectedType, setType, loadEntries, refreshEntries, deleteEntry, isLoading, isRefreshing } = useEntryStore();
    const [speedDialOpen, setSpeedDialOpen] = useState(false);

    useEffect(() => {
        loadEntries({ reset: true });
    }, [loadEntries, selectedType]);

    const confirmDelete = (id: string) => {
        Alert.alert('Delete entry?', 'This entry will be removed from your records.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(id) },
        ]);
    };

    return (
        <Screen>
            <View style={styles.header}>
                <Text style={styles.title}>Entries</Text>
                <Text style={styles.subtitle}>Long press an entry to delete it.</Text>
            </View>

            <EntryTypeFilter value={selectedType} onChange={setType} />

            <FlatList
                data={entries}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => <EntryListItem entry={item} onLongPress={() => confirmDelete(item.id)} />}
                onEndReached={() => loadEntries()}
                onEndReachedThreshold={0.4}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => refreshEntries()} />}
                ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Loading entries...' : 'No entries found.'}</Text>}
            />

            {speedDialOpen && (
                <View style={styles.speedDial}>
                    {ENTRY_TYPES.map((type) => (
                        <Pressable key={type} style={styles.speedDialItem} onPress={() => { setSpeedDialOpen(false); onAdd(type); }}>
                            <Text style={styles.speedDialText}>{type}</Text>
                        </Pressable>
                    ))}
                </View>
            )}
            <Pressable style={styles.fab} onPress={() => setSpeedDialOpen((value) => !value)}>
                <Text style={styles.fabText}>{speedDialOpen ? 'x' : '+'}</Text>
            </Pressable>
        </Screen>
    );
};

const styles = StyleSheet.create({
    header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
    title: { color: AppColors.ink, fontSize: 28, fontWeight: '900' },
    subtitle: { color: AppColors.muted, marginTop: 2 },
    list: { padding: 16, gap: 10, paddingBottom: 126 },
    empty: { color: AppColors.muted, textAlign: 'center', marginTop: 40 },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 88,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: AppColors.terra,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
    },
    fabText: { color: AppColors.white, fontSize: 30, fontWeight: '700', lineHeight: 34 },
    speedDial: { position: 'absolute', right: 20, bottom: 152, gap: 8, alignItems: 'flex-end' },
    speedDialItem: { backgroundColor: AppColors.ink, paddingHorizontal: 14, height: 38, borderRadius: 19, justifyContent: 'center' },
    speedDialText: { color: AppColors.white, fontWeight: '800', textTransform: 'capitalize' },
});

