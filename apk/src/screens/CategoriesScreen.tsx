import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppTextField } from '../components/AppTextField';
import { Screen } from '../components/Screen';
import { AppColors } from '../core/constants/colors';
import { ENTRY_TYPES, type EntryType } from '../models/common';
import { useCategoryStore } from '../store/categoryStore';

export const CategoriesScreen: React.FC = () => {
    const { categories, loadCategories, addCategory, isLoading } = useCategoryStore();
    const [showAdd, setShowAdd] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<EntryType>('expense');
    const [color, setColor] = useState(AppColors.sage);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const save = async () => {
        if (!name.trim()) {
            Alert.alert('Category name is required.');
            return;
        }
        try {
            await addCategory({ name: name.trim(), type, color, icon: 'tag' });
            setName('');
            setShowAdd(false);
        } catch (err) {
            Alert.alert('Could not create category', err instanceof Error ? err.message : 'Please try again.');
        }
    };

    return (
        <Screen>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Categories</Text>
                    <Text style={styles.subtitle}>Income, expense, savings and investment labels.</Text>
                </View>
                <AppButton title="Add" onPress={() => setShowAdd(true)} style={styles.addButton} />
            </View>

            <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshing={isLoading}
                onRefresh={() => loadCategories()}
                renderItem={({ item }) => (
                    <View style={styles.row}>
                        <View style={[styles.dot, { backgroundColor: item.color }]} />
                        <View style={styles.middle}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.meta}>{item.type}{item.isDefault ? ' · default' : ''}</Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No categories found.</Text>}
            />

            <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>Add Category</Text>
                        <AppTextField label="Name" value={name} onChangeText={setName} placeholder="Groceries" />
                        <Text style={styles.label}>Type</Text>
                        <View style={styles.optionGrid}>
                            {ENTRY_TYPES.map((item) => (
                                <Pressable key={item} onPress={() => setType(item)} style={[styles.option, type === item && styles.optionActive]}>
                                    <Text style={[styles.optionText, type === item && styles.optionTextActive]}>{item}</Text>
                                </Pressable>
                            ))}
                        </View>
                        <Text style={styles.label}>Color</Text>
                        <View style={styles.optionGrid}>
                            {[AppColors.sage, AppColors.terra, AppColors.mustard, AppColors.bkash, '#3B6EA8'].map((item) => (
                                <Pressable key={item} onPress={() => setColor(item)} style={[styles.swatch, { backgroundColor: item }, color === item && styles.swatchActive]} />
                            ))}
                        </View>
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
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: AppColors.white, borderRadius: 8, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
    dot: { width: 16, height: 16, borderRadius: 8 },
    middle: { flex: 1 },
    name: { color: AppColors.ink, fontWeight: '900', fontSize: 15 },
    meta: { color: AppColors.muted, marginTop: 2, textTransform: 'capitalize' },
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
    swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent' },
    swatchActive: { borderColor: AppColors.ink },
    actions: { flexDirection: 'row', gap: 10 },
    actionButton: { flex: 1 },
});

