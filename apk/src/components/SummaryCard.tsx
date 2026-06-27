import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../core/constants/colors';
import { formatTaka } from '../core/utils/currency';

interface SummaryCardProps {
    label: string;
    value: number;
    tone: 'income' | 'expense' | 'savings' | 'investment';
    count?: number;
}

const toneColors = {
    income: AppColors.sage,
    expense: AppColors.terra,
    savings: AppColors.mustard,
    investment: '#3B6EA8',
};

export const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, tone, count }) => (
    <View style={styles.card}>
        <View style={[styles.marker, { backgroundColor: toneColors[tone] }]} />
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{formatTaka(value)}</Text>
        {typeof count === 'number' && <Text style={styles.count}>{count} entries</Text>}
    </View>
);

const styles = StyleSheet.create({
    card: {
        flex: 1,
        minWidth: '47%',
        backgroundColor: AppColors.white,
        borderRadius: 8,
        padding: 14,
        borderWidth: 1,
        borderColor: AppColors.border,
        gap: 5,
    },
    marker: { width: 26, height: 4, borderRadius: 2, marginBottom: 4 },
    label: { color: AppColors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    value: { color: AppColors.ink, fontSize: 18, fontWeight: '800' },
    count: { color: AppColors.muted, fontSize: 12 },
});

