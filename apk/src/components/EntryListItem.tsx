import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../core/constants/colors';
import { formatTaka } from '../core/utils/currency';
import { formatDate } from '../core/utils/date';
import type { Entry } from '../models/entry';

interface EntryListItemProps {
    entry: Entry;
    onPress?: () => void;
    onLongPress?: () => void;
}

const negativeTypes = new Set(['expense', 'investment', 'payable']);

export const EntryListItem: React.FC<EntryListItemProps> = ({ entry, onPress, onLongPress }) => {
    const negative = negativeTypes.has(entry.type);
    return (
        <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.row}>
            <View style={[styles.icon, { backgroundColor: entry.category.color || AppColors.sage }]}>
                <Text style={styles.iconText}>{entry.category.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.middle}>
                <Text style={styles.title} numberOfLines={1}>{entry.note || entry.category.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>{entry.category.name} · {entry.source} · {formatDate(entry.date)}</Text>
            </View>
            <Text style={[styles.amount, negative ? styles.negative : styles.positive]}>
                {negative ? '-' : '+'}{formatTaka(entry.amount)}
            </Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    row: {
        minHeight: 70,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: AppColors.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: AppColors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    icon: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    iconText: { color: AppColors.white, fontWeight: '800' },
    middle: { flex: 1, minWidth: 0 },
    title: { color: AppColors.ink, fontWeight: '800', fontSize: 14 },
    meta: { color: AppColors.muted, fontSize: 12, marginTop: 3 },
    amount: { fontWeight: '800', fontSize: 13, maxWidth: 120, textAlign: 'right' },
    positive: { color: AppColors.sage },
    negative: { color: AppColors.terra },
});

