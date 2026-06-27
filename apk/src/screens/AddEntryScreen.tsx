import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppTextField } from '../components/AppTextField';
import { Screen } from '../components/Screen';
import { AppColors } from '../core/constants/colors';
import { ENTRY_TYPES, PAYMENT_SOURCES, type EntryType, type PaymentSource } from '../models/common';
import { entryService } from '../services/entryService';
import { useAccountStore } from '../store/accountStore';
import { useCategoryStore } from '../store/categoryStore';
import { useEntryStore } from '../store/entryStore';
import { useSummaryStore } from '../store/summaryStore';

interface AddEntryScreenProps {
    initialType?: EntryType;
    onDone: () => void;
}

export const AddEntryScreen: React.FC<AddEntryScreenProps> = ({ initialType = 'expense', onDone }) => {
    const { categories, loadCategories } = useCategoryStore();
    const { accounts, loadAccounts } = useAccountStore();
    const addEntry = useEntryStore((state) => state.addEntry);
    const loadSummary = useSummaryStore((state) => state.loadSummary);

    const [type, setType] = useState<EntryType>(initialType);
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [source, setSource] = useState<PaymentSource>('cash');
    const [accountId, setAccountId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState('');
    const [sms, setSms] = useState('');
    const [showSms, setShowSms] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setType(initialType);
    }, [initialType]);

    useEffect(() => {
        loadCategories(type);
        loadAccounts();
    }, [loadCategories, loadAccounts, type]);

    const typeCategories = useMemo(() => categories.filter((category) => category.type === type), [categories, type]);

    useEffect(() => {
        if (!categoryId && typeCategories[0]) setCategoryId(typeCategories[0].id);
    }, [categoryId, typeCategories]);

    const save = async () => {
        const numericAmount = Number(amount);
        if (!numericAmount || !categoryId) {
            Alert.alert('Missing details', 'Amount and category are required.');
            return;
        }
        setIsSaving(true);
        try {
            await addEntry({
                type,
                amount: numericAmount,
                categoryId,
                source,
                accountId: accountId || undefined,
                date: new Date(date).toISOString(),
                note,
                parsedFromSms: Boolean(sms.trim()),
                rawSms: sms.trim() || undefined,
            });
            await loadSummary();
            onDone();
        } catch (err) {
            Alert.alert('Could not save entry', err instanceof Error ? err.message : 'Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const parseSms = async () => {
        if (!sms.trim()) return;
        try {
            const result = await entryService.parseSms(sms);
            if (result.amount) setAmount(String(result.amount));
            setSource(result.source);
            if (result.date) setDate(result.date.slice(0, 10));
            setNote(result.reference ? `Ref: ${result.reference}` : note);
            setShowSms(false);
        } catch {
            const match = sms.match(/(?:BDT|Tk|৳)\s*([0-9,.]+)/i) ?? sms.match(/([0-9,.]+)\s*(?:BDT|Tk|৳)/i);
            if (match?.[1]) setAmount(match[1].replace(/,/g, ''));
            setShowSms(false);
        }
    };

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Pressable onPress={onDone} style={styles.backButton}><Text style={styles.backText}>{'<'}</Text></Pressable>
                    <Text style={styles.title}>Add Entry</Text>
                </View>

                <View style={styles.segment}>
                    {ENTRY_TYPES.map((item) => (
                        <Pressable key={item} onPress={() => { setType(item); setCategoryId(''); }} style={[styles.segmentItem, type === item && styles.segmentActive]}>
                            <Text style={[styles.segmentText, type === item && styles.segmentTextActive]}>{item}</Text>
                        </Pressable>
                    ))}
                </View>

                <AppTextField label="Amount" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0" />

                <Text style={styles.label}>Category</Text>
                <View style={styles.optionGrid}>
                    {typeCategories.map((category) => (
                        <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.option, categoryId === category.id && styles.optionActive]}>
                            <Text style={[styles.optionText, categoryId === category.id && styles.optionTextActive]}>{category.name}</Text>
                        </Pressable>
                    ))}
                </View>

                <Text style={styles.label}>Source</Text>
                <View style={styles.optionGrid}>
                    {PAYMENT_SOURCES.map((item) => (
                        <Pressable key={item} onPress={() => setSource(item)} style={[styles.option, source === item && styles.optionActive]}>
                            <Text style={[styles.optionText, source === item && styles.optionTextActive]}>{item}</Text>
                        </Pressable>
                    ))}
                </View>

                {type === 'savings' && (
                    <>
                        <Text style={styles.label}>Account</Text>
                        <View style={styles.optionGrid}>
                            {accounts.map((account) => (
                                <Pressable key={account.id} onPress={() => setAccountId(account.id)} style={[styles.option, accountId === account.id && styles.optionActive]}>
                                    <Text style={[styles.optionText, accountId === account.id && styles.optionTextActive]}>{account.name}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </>
                )}

                <AppTextField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
                <AppTextField label="Note" value={note} onChangeText={setNote} multiline placeholder="Optional note" />

                <AppButton title="Parse SMS" variant="secondary" onPress={() => setShowSms(true)} />
                <AppButton title="Save Entry" loading={isSaving} onPress={save} />
            </ScrollView>

            <Modal visible={showSms} transparent animationType="slide" onRequestClose={() => setShowSms(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>Paste SMS</Text>
                        <AppTextField label="SMS text" value={sms} onChangeText={setSms} multiline placeholder="Paste a bank or wallet SMS" />
                        <View style={styles.modalActions}>
                            <AppButton title="Cancel" variant="secondary" onPress={() => setShowSms(false)} style={styles.modalButton} />
                            <AppButton title="Parse" onPress={parseSms} style={styles.modalButton} />
                        </View>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
};

const styles = StyleSheet.create({
    content: { padding: 16, gap: 14, paddingBottom: 96 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: AppColors.white, borderWidth: 1, borderColor: AppColors.border, alignItems: 'center', justifyContent: 'center' },
    backText: { color: AppColors.ink, fontSize: 20, fontWeight: '900' },
    title: { color: AppColors.ink, fontSize: 26, fontWeight: '900' },
    segment: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    segmentItem: { paddingHorizontal: 11, height: 36, borderRadius: 18, borderWidth: 1, borderColor: AppColors.border, backgroundColor: AppColors.white, justifyContent: 'center' },
    segmentActive: { backgroundColor: AppColors.terra, borderColor: AppColors.terra },
    segmentText: { color: AppColors.ink, fontWeight: '800', textTransform: 'capitalize', fontSize: 12 },
    segmentTextActive: { color: AppColors.white },
    label: { color: AppColors.ink, fontWeight: '800', fontSize: 13 },
    optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    option: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: AppColors.border, backgroundColor: AppColors.white, alignItems: 'center', justifyContent: 'center' },
    optionActive: { backgroundColor: AppColors.sage, borderColor: AppColors.sage },
    optionText: { color: AppColors.ink, fontWeight: '700' },
    optionTextActive: { color: AppColors.white },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
    modal: { backgroundColor: AppColors.paperMist, padding: 16, borderTopLeftRadius: 8, borderTopRightRadius: 8, gap: 14 },
    modalTitle: { color: AppColors.ink, fontSize: 20, fontWeight: '900' },
    modalActions: { flexDirection: 'row', gap: 10 },
    modalButton: { flex: 1 },
});

