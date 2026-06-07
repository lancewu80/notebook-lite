import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput,
  StyleSheet, Alert, SafeAreaView, StatusBar,
} from 'react-native';
import { useNotes } from '../context/NoteContext';

const CATEGORY_COLORS = [
  '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B6B',
  '#C77DFF', '#FFB347', '#A8DADC', '#F4A261',
];

export default function HomeScreen({ navigation }) {
  const {
    categories, addCategory, deleteCategory, updateCategory,
    getNotesByCategory, loading,
  } = useNotes();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [inputName, setInputName] = useState('');

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={{ marginRight: 4, padding: 4 }}
        >
          <Text style={{ fontSize: 20, color: '#fff' }}>🔍</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleAddCategory = async () => {
    const name = inputName.trim();
    if (!name) return;
    await addCategory(name);
    setInputName('');
    setAddModalVisible(false);
  };

  const handleEditCategory = async () => {
    const name = inputName.trim();
    if (!name || !editModal) return;
    await updateCategory(editModal.id, name);
    setInputName('');
    setEditModal(null);
  };

  const handleLongPress = (cat) => {
    Alert.alert(cat.name, '請選擇操作', [
      { text: '重新命名', onPress: () => { setEditModal(cat); setInputName(cat.name); } },
      {
        text: '刪除分類', style: 'destructive',
        onPress: () => Alert.alert('刪除分類', `確定刪除「${cat.name}」及所有筆記？`, [
          { text: '取消', style: 'cancel' },
          { text: '刪除', style: 'destructive', onPress: () => deleteCategory(cat.id) },
        ]),
      },
      { text: '取消', style: 'cancel' },
    ]);
  };

  if (loading) {
    return <View style={styles.center}><Text style={styles.loadingText}>載入中...</Text></View>;
  }

  const totalNotes = categories.reduce((sum, c) => sum + getNotesByCategory(c.id).length, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Summary bar */}
      {categories.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {categories.length} 個分類 · {totalNotes} 則筆記
          </Text>
        </View>
      )}

      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>還沒有分類</Text>
            <Text style={styles.emptySubText}>點擊右下角 + 建立第一個分類</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const noteCount = getNotesByCategory(item.id).length;
          const accentColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
          return (
            <TouchableOpacity
              style={styles.categoryCard}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('Category', { categoryId: item.id, categoryName: item.name })}
              onLongPress={() => handleLongPress(item)}
            >
              <View style={[styles.categoryAccent, { backgroundColor: accentColor }]} />
              <View style={styles.categoryBody}>
                <Text style={styles.categoryName}>{item.name}</Text>
                <Text style={styles.noteCount}>
                  {noteCount > 0 ? `${noteCount} 則筆記` : '尚無筆記'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => { setInputName(''); setAddModalVisible(true); }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={addModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>新增分類</Text>
            <TextInput
              style={styles.input}
              placeholder="分類名稱"
              placeholderTextColor="#bbb"
              value={inputName}
              onChangeText={setInputName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAddCategory}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => { setAddModalVisible(false); setInputName(''); }} style={styles.btnCancel}>
                <Text style={styles.btnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddCategory} style={styles.btnConfirm}>
                <Text style={styles.btnConfirmText}>新增</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>重新命名</Text>
            <TextInput
              style={styles.input}
              placeholder="分類名稱"
              placeholderTextColor="#bbb"
              value={inputName}
              onChangeText={setInputName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleEditCategory}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => { setEditModal(null); setInputName(''); }} style={styles.btnCancel}>
                <Text style={styles.btnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditCategory} style={styles.btnConfirm}>
                <Text style={styles.btnConfirmText}>儲存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#888' },

  summaryBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryText: { fontSize: 12, color: '#999', fontWeight: '600' },

  list: { padding: 16, paddingBottom: 88 },

  empty: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#555' },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 8 },

  categoryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    marginBottom: 12, overflow: 'hidden',
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
  },
  categoryAccent: { width: 6, alignSelf: 'stretch' },
  categoryBody: { flex: 1, padding: 16 },
  categoryName: { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  noteCount: { fontSize: 13, color: '#888', marginTop: 3 },
  chevron: { fontSize: 28, color: '#ccc', paddingRight: 16 },

  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
  fabText: { fontSize: 30, color: '#fff', marginTop: -2 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', paddingHorizontal: 32,
  },
  modalBox: { backgroundColor: '#fff', borderRadius: 18, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  input: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 16,
    color: '#1a1a2e', marginBottom: 18, backgroundColor: '#fafafa',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btnCancel: { paddingVertical: 10, paddingHorizontal: 16 },
  btnCancelText: { fontSize: 15, color: '#888' },
  btnConfirm: {
    backgroundColor: '#1a1a2e', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 22,
  },
  btnConfirmText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
