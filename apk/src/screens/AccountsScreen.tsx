import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppTextField } from '../components/AppTextField';
import { Screen } from '../components/Screen';
import { AppColors } from '../core/constants/colors';
import { formatTaka } from '../core/utils/currency';
import type { AccountType, MobileProvider } from '../models/account';
import { useAccountStore } from '../store/accountStore';

export const AccountsScreen: React.FC = () => {
    const { accounts, loadAccounts, addAccount, isLoading } = useAccountStore();
    const [showAdd, setShowAdd] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<AccountType>('bank');
    const [provider, setProvider] = useState<MobileProvider>('bkash');
    const [balance, setBalance] = useState('');

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    const save = async () => {
        if (!name.trim()) {
            Alert.alert('Account name is required.');
            return;
        }
        try {
            await addAccount({
                name: name.trim(),
                type,
                provider: type === 'mobile' ? provider : undefined,
                balance: Number(balance || 0),
            });
            setName('');
            setBalance('');
            setShowAdd(false);
        } catch (err) {
            Alert.alert('Could not create account', err instanceof Error ? err.message : 'Please try again.');
        }
    };

    return (
        <Screen>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Accounts</Text>
                    <Text style={styles.subtitle}>Track savings accounts and wallet balances.</Text>
                </View>
                <AppButton title="Add" onPress={() => setShowAdd(true)} style={styles.addButton} />
            </View>

            <FlatList
                data={accounts}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshing={isLoading}
                onRefresh={loadAccounts}
                renderItem={({ item }) => (
                    <View style={styles.row}>
                        <View>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.meta}>{item.type}{item.provider ? ` · ${item.provider}` : ''}</Text>
                        </View>
                        <Text style={styles.balance}>{formatTaka(item.balance)}</Text>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No accounts found.</Text>}
            />

            <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>Add Account</Text>
                        <AppTextField label="Name" value={name} onChangeText={setName} placeholder="Savings account" />
                        <Text style={styles.label}>Type</Text>
                        <View style={styles.optionGrid}>
                            {(['bank', 'mobile'] as AccountType[]).map((item) => (
                                <Pressable key={item} onPress={() => setType(item)} style={[styles.option, type === item && styles.optionActive]}>
                                    <Text style={[styles.optionText, type === item && styles.optionTextActive]}>{item}</Text>
                                </Pressable>
                            ))}
                        </View>
                        {type === 'mobile' && (
                            <>
                                <Text style={styles.label}>Provider</Text>
                                <View style={styles.optionGrid}>
                                    {(['bkash', 'nagad', 'rocket'] as MobileProvider[]).map((item) => (
                                        <Pressable key={item} onPress={() => setProvider(item)} style={[styles.option, provider === item && styles.optionActive]}>
                                            <Text style={[styles.optionText, provider === item && styles.optionTextActive]}>{item}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </>
                        )}
                        <AppTextField label="Opening Balance" keyboardType="decimal-pad" value={balance} onChangeText={setBalance} placeholder="0" />
                        <View style={styles.actions}>
                            <AppButton title="Cancel" variant="secondary" onPress={() => setShowAdd(false)} style={styles.actionButton} />
                            <AppButton title="Save" onPress={save} style={styles.actionButton} />
                        </View>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
};

const styles = StyleSheet.create({
    header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    title: { color: AppColors.ink, fontSize: 28, fontWeight: '900' },
    subtitle: { color: AppColors.muted, marginTop: 2, maxWidth: 230 },
    addButton: { width: 82 },
    list: { padding: 16, gap: 10, paddingBottom: 96 },
    row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: AppColors.white, borderRadius: 8, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
    name: { color: AppColors.ink, fontWeight: '900', fontSize: 15 },
    meta: { color: AppColors.muted, marginTop: 2, textTransform: 'capitalize' },
    balance: { color: AppColors.sage, fontWeight: '900' },
    empty: { textAlign: 'center', color: AppColors.muted, marginTop: 40 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
    modal: { backgroundColor: AppColors.paperMist, padding: 16, borderTopLeftRadius: 8, borderTopRightRadius: 8, gap: 14 },
    modalTitle: { color: AppColors.ink, fontSize: 20, fontWeight: '900' },
    label: { color: AppColors.ink, fontWeight: '800', fontSize: 13 },
    optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    option: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: AppColors.white, borderWidth: 1, borderColor: AppColors.border, justifyContent: 'center' },
    optionActive: { backgroundColor: AppColors.terra, borderColor: AppColors.terra },
    optionText: { color: AppColors.ink, fontWeight: '700', textTransform: 'capitalize' },
    optionTextActive: { color: AppColors.white },
    actions: { flexDirection: 'row', gap: 10 },
    actionButton: { flex: 1 },
});

