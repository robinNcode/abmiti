import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { AppColors } from '../core/constants/colors';
import { formatCompact, formatTaka } from '../core/utils/currency';
import { useSummaryStore } from '../store/summaryStore';

export const AnalyticsScreen: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const { trend, categories, loadTrend, loadSummary } = useSummaryStore();

    useEffect(() => {
        loadTrend(year);
        loadSummary();
    }, [loadTrend, loadSummary, year]);

    const maxValue = useMemo(() => Math.max(1, ...trend.flatMap((item) => [item.income, item.expense])), [trend]);

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.eyebrow}>Analytics</Text>
                        <Text style={styles.title}>{year}</Text>
                    </View>
                    <View style={styles.yearSwitch}>
                        {[currentYear - 1, currentYear, currentYear + 1].map((item) => (
                            <Pressable key={item} onPress={() => setYear(item)} style={[styles.yearChip, item === year && styles.yearChipActive]}>
                                <Text style={[styles.yearText, item === year && styles.yearTextActive]}>{item}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.panel}>
                    <Text style={styles.panelTitle}>Income vs Expense</Text>
                    {trend.map((item) => (
                        <View key={`${item.year}-${item.month}`} style={styles.monthRow}>
                            <Text style={styles.monthLabel}>{String(item.month).padStart(2, '0')}</Text>
                            <View style={styles.barGroup}>
                                <View style={[styles.bar, styles.incomeBar, { width: `${Math.max(2, (item.income / maxValue) * 100)}%` }]} />
                                <View style={[styles.bar, styles.expenseBar, { width: `${Math.max(2, (item.expense / maxValue) * 100)}%` }]} />
                            </View>
                            <Text style={styles.compact}>{formatCompact(item.income - item.expense)}</Text>
                        </View>
                    ))}
                    <View style={styles.legend}>
                        <Text style={styles.legendText}>Income</Text>
                        <Text style={styles.legendText}>Expense</Text>
                    </View>
                </View>

                <View style={styles.panel}>
                    <Text style={styles.panelTitle}>Current Category Mix</Text>
                    {categories.length === 0 ? <Text style={styles.empty}>No category data yet.</Text> : categories.map((item) => (
                        <View key={item.category.id} style={styles.categoryRow}>
                            <View style={[styles.dot, { backgroundColor: item.category.color }]} />
                            <View style={styles.categoryMain}>
                                <Text style={styles.categoryName}>{item.category.name}</Text>
                                <View style={styles.track}><View style={[styles.fill, { width: `${item.percentage}%`, backgroundColor: item.category.color }]} /></View>
                            </View>
                            <Text style={styles.amount}>{formatTaka(item.total)}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    content: { padding: 16, gap: 14, paddingBottom: 96 },
    header: { gap: 12 },
    eyebrow: { color: AppColors.terra, fontWeight: '800', textTransform: 'uppercase', fontSize: 12 },
    title: { color: AppColors.ink, fontSize: 28, fontWeight: '900' },
    yearSwitch: { flexDirection: 'row', gap: 8 },
    yearChip: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: AppColors.white, borderWidth: 1, borderColor: AppColors.border, justifyContent: 'center' },
    yearChipActive: { backgroundColor: AppColors.terra, borderColor: AppColors.terra },
    yearText: { color: AppColors.ink, fontWeight: '800' },
    yearTextActive: { color: AppColors.white },
    panel: { backgroundColor: AppColors.white, borderRadius: 8, padding: 14, borderWidth: 1, borderColor: AppColors.border, gap: 12 },
    panelTitle: { color: AppColors.ink, fontSize: 17, fontWeight: '900' },
    monthRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    monthLabel: { width: 24, color: AppColors.muted, fontWeight: '800' },
    barGroup: { flex: 1, gap: 3 },
    bar: { height: 7, borderRadius: 4 },
    incomeBar: { backgroundColor: AppColors.sage },
    expenseBar: { backgroundColor: AppColors.terra },
    compact: { width: 60, textAlign: 'right', color: AppColors.ink, fontWeight: '800', fontSize: 12 },
    legend: { flexDirection: 'row', gap: 16 },
    legendText: { color: AppColors.muted, fontWeight: '700' },
    categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dot: { width: 12, height: 12, borderRadius: 6 },
    categoryMain: { flex: 1, gap: 5 },
    categoryName: { color: AppColors.ink, fontWeight: '800' },
    track: { height: 8, borderRadius: 4, backgroundColor: AppColors.paperMist, overflow: 'hidden' },
    fill: { height: '100%' },
    amount: { color: AppColors.ink, fontWeight: '800', fontSize: 12 },
    empty: { color: AppColors.muted },
});

