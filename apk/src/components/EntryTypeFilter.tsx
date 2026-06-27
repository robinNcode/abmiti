import React from 'react';
import { ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { AppColors } from '../core/constants/colors';
import { ENTRY_TYPES, type EntryType } from '../models/common';

interface EntryTypeFilterProps {
    value: EntryType | 'all';
    onChange: (value: EntryType | 'all') => void;
}

export const EntryTypeFilter: React.FC<EntryTypeFilterProps> = ({ value, onChange }) => {
    const items: (EntryType | 'all')[] = ['all', ...ENTRY_TYPES];
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
            {items.map((item) => {
                const active = value === item;
                return (
                    <Pressable key={item} onPress={() => onChange(item)} style={[styles.chip, active && styles.activeChip]}>
                        <Text style={[styles.chipText, active && styles.activeText]}>{item}</Text>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    list: { gap: 8, paddingHorizontal: 16 },
    chip: {
        height: 36,
        paddingHorizontal: 13,
        borderRadius: 18,
        backgroundColor: AppColors.white,
        borderWidth: 1,
        borderColor: AppColors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeChip: { backgroundColor: AppColors.terra, borderColor: AppColors.terra },
    chipText: { color: AppColors.ink, fontWeight: '700', textTransform: 'capitalize' },
    activeText: { color: AppColors.white },
});

