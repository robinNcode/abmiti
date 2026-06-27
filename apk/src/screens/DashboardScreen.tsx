import React, { useEffect } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { SummaryCard } from '../components/SummaryCard';
import { EntryListItem } from '../components/EntryListItem';
import { AppColors } from '../core/constants/colors';
import { formatMonth } from '../core/utils/date';
import { formatTaka } from '../core/utils/currency';
import { useEntryStore } from '../store/entryStore';
import { useSummaryStore } from '../store/summaryStore';

export const DashboardScreen: React.FC = () => {
    const { month, year, monthly, categories, isLoading, isStale, setMonth, loadSummary } = useSummaryStore();
    const { entries, loadEntries } = useEntryStore();

    useEffect(() => {
        loadSummary();
        loadEntries({ reset: true, month, year });
    }, [loadSummary, loadEntries, month, year]);

    const shiftMonth = (delta: number) => {
        const next = new Date(year, month - 1 + delta, 1);
        setMonth(next.getMonth() + 1, next.getFullYear());
    };

    const budgetProgress = Math.min(monthly.budgetUsed, 100);
    const recentEntries = entries.slice(0, 8);

    return (
        <Screen>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadSummary} />}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.eyebrow}>Dashboard</Text>
                        <Text style={styles.title}>{formatMonth(month, year)}</Text>
                    </View>
                    <View style={styles.monthNav}>
                        <Pressable onPress={() => shiftMonth(-1)} style={styles.navButton}><Text style={styles.navText}>{'<'}</Text></Pressable>
                        <Pressable onPress={() => shiftMonth(1)} style={styles.navButton}><Text style={styles.navText}>{'>'}</Text></Pressable>
                    </View>
                </View>

                {isStale && <Text style={styles.banner}>Showing cached data while refreshing.</Text>}

                <View style={styles.cardGrid}>
                    <SummaryCard label="Income" value={monthly.income} count={monthly.incomeCount} tone="income" />
                    <SummaryCard label="Expense" value={monthly.expense} count={monthly.expenseCount} tone="expense" />
                    <SummaryCard label="Investment" value={monthly.investment} count={monthly.investmentCount} tone="investment" />
                    <SummaryCard label="Net Savings" value={monthly.savings} count={monthly.savingsCount} tone="savings" />
                </View>

                <View style={styles.panel}>
                    <View style={styles.panelHeader}>
                        <Text style={styles.panelTitle}>Budget</Text>
                        <Text style={styles.muted}>{monthly.budgetUsed.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${budgetProgress}%` }]} />
                    </View>
                    <View style={styles.budgetRow}>
                        <Text style={styles.muted}>Spent {formatTaka(monthly.expense)}</Text>
                        <Text style={styles.muted}>Remaining {formatTaka(monthly.remainingBudget)}</Text>
                    </View>
                </View>

                <View style={styles.panel}>
                    <Text style={styles.panelTitle}>Category Breakdown</Text>
                    {categories.length === 0 ? (
                        <Text style={styles.empty}>No category spending yet.</Text>
                    ) : categories.slice(0, 5).map((item) => (
                        <View key={item.category.id} style={styles.categoryRow}>
                            <View style={[styles.dot, { backgroundColor: item.category.color }]} />
                            <Text style={styles.categoryName}>{item.category.name}</Text>
                            <View style={styles.categoryTrack}><View style={[styles.categoryFill, { width: `${item.percentage}%`, backgroundColor: item.category.color }]} /></View>
                            <Text style={styles.percent}>{item.percentage}%</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.panel}>
                    <Text style={styles.panelTitle}>Recent Entries</Text>
                    {recentEntries.length === 0 ? (
                        <Text style={styles.empty}>No entries this month.</Text>
                    ) : recentEntries.map((entry) => <EntryListItem key={entry.id} entry={entry} />)}
                </View>
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    content: { padding: 16, gap: 14, paddingBottom: 96 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    eyebrow: { color: AppColors.terra, fontWeight: '800', textTransform: 'uppercase', fontSize: 12 },
    title: { color: AppColors.ink, fontSize: 26, fontWeight: '900' },
    monthNav: { flexDirection: 'row', gap: 8 },
    navButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: AppColors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: AppColors.border },
    navText: { fontSize: 18, fontWeight: '900', color: AppColors.ink },
    banner: { backgroundColor: AppColors.mustard, color: AppColors.ink, padding: 10, borderRadius: 8, fontWeight: '700' },
    cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    panel: { backgroundColor: AppColors.white, borderRadius: 8, padding: 14, borderWidth: 1, borderColor: AppColors.border, gap: 10 },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    panelTitle: { color: AppColors.ink, fontSize: 17, fontWeight: '900' },
    muted: { color: AppColors.muted, fontSize: 12, fontWeight: '700' },
    progressTrack: { height: 10, backgroundColor: AppColors.paperMist, borderRadius: 6, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: AppColors.terra },
    budgetRow: { flexDirection: 'row', justifyContent: 'space-between' },
    categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    categoryName: { width: 82, color: AppColors.ink, fontWeight: '700', fontSize: 12 },
    categoryTrack: { flex: 1, height: 8, backgroundColor: AppColors.paperMist, borderRadius: 5, overflow: 'hidden' },
    categoryFill: { height: '100%' },
    percent: { width: 42, color: AppColors.muted, textAlign: 'right', fontSize: 12 },
    empty: { color: AppColors.muted, paddingVertical: 8 },
});

