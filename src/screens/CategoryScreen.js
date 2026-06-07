import React, { useLayoutEffect, useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, SafeAreaView, Modal,
} from 'react-native';
import { useNotes } from '../context/NoteContext';

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getContrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#333333' : '#ffffff';
}

const SORT_OPTIONS = [
  { key: 'updatedDesc', label: '最近更新', icon: '🕐' },
  { key: 'updatedAsc',  label: '最舊更新', icon: '🕓' },
  { key: 'createdDesc', label: '最新建立', icon: '✨' },
  { key: 'titleAsc',    label: '標題 A → Z', icon: '🔤' },
];

function sortNotes(notes, sortKey) {
  const arr = [...notes];
  switch (sortKey) {
    case 'updatedDesc': arr.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); break;
    case 'updatedAsc':  arr.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)); break;
    case 'createdDesc': arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
    case 'titleAsc':    arr.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
    default: break;
  }
  // Pinned always first
  return [...arr.filter(n => n.pinned), ...arr.filter(n => !n.pinned)];
}

export default function CategoryScreen({ navigation, route }) {
  const { categoryId, categoryName } = route.params;
  const { getNotesByCategory, deleteNote, togglePin } = useNotes();

  const [sortKey, setSortKey] = useState('updatedDesc');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const rawNotes = getNotesByCategory(categoryId);
  const notes = useMemo(() => sortNotes(rawNotes, sortKey), [rawNotes, sortKey]);

  const currentSort = SORT_OPTIONS.find(o => o.key === sortKey);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: categoryName,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setSortModalVisible(true)}
          style={{ marginRight: 4, padding: 4 }}
        >
          <Text style={{ fontSize: 14, color: '#fff', fontWeight: '600' }}>
            {currentSort?.icon} 排序
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [categoryName, navigation, currentSort]);

  const handleLongPress = (note) => {
    Alert.alert(note.title || '無標題', '請選擇操作', [
      {
        text: note.pinned ? '取消釘選 📌' : '釘選 📌',
        onPress: () => togglePin(note.id),
      },
      {
        text: '刪除筆記', style: 'destructive',
        onPress: () => Alert.alert('刪除筆記', `確定刪除「${note.title || '無標題'}」嗎？`, [
          { text: '取消', style: 'cancel' },
          { text: '刪除', style: 'destructive', onPress: () => deleteNote(note.id) },
        ]),
      },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const renderNote = ({ item }) => {
    const bg = item.color || '#FFFFFF';
    const textColor = getContrastColor(bg);
    const subTextColor = textColor === '#333333' ? '#666' : 'rgba(255,255,255,0.75)';
    const dividerColor = textColor === '#333333' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.2)';

    return (
      <TouchableOpacity
        style={[styles.noteCard, { backgroundColor: bg }]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('NoteEditor', { noteId: item.id, categoryId })}
        onLongPress={() => handleLongPress(item)}
      >
        {/* Pin indicator */}
        {item.pinned && (
          <Text style={styles.pinBadge}>📌</Text>
        )}
        <Text style={[styles.noteTitle, { color: textColor }]} numberOfLines={2}>
          {item.title || '無標題'}
        </Text>
        {!!item.content && (
          <Text style={[styles.noteContent, { color: subTextColor }]} numberOfLines={5}>
            {item.content}
          </Text>
        )}
        <View style={[styles.noteDivider, { backgroundColor: dividerColor }]} />
        <Text style={[styles.noteDate, { color: subTextColor }]}>
          ✏️ {formatDateTime(item.updatedAt)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {notes.length > 0 && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {notes.length} 則筆記
            {notes.filter(n => n.pinned).length > 0
              ? ` · ${notes.filter(n => n.pinned).length} 釘選`
              : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>還沒有筆記</Text>
            <Text style={styles.emptySubText}>點擊右下角 + 建立第一則筆記</Text>
          </View>
        }
        renderItem={renderNote}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('NoteEditor', { categoryId })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Sort Modal */}
      <Modal visible={sortModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={styles.sortBox}>
            <Text style={styles.sortTitle}>排序方式</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortOption, sortKey === opt.key && styles.sortOptionActive]}
                onPress={() => { setSortKey(opt.key); setSortModalVisible(false); }}
              >
                <Text style={styles.sortOptionIcon}>{opt.icon}</Text>
                <Text style={[styles.sortOptionText, sortKey === opt.key && styles.sortOptionTextActive]}>
                  {opt.label}
                </Text>
                {sortKey === opt.key && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f5' },

  statsBar: {
    paddingHorizontal: 20, paddingVertical: 7,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  statsText: { fontSize: 12, color: '#999', fontWeight: '600' },

  list: { padding: 10, paddingBottom: 88 },
  row: { justifyContent: 'space-between' },

  empty: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#555' },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 8 },

  noteCard: {
    flex: 1, margin: 5, borderRadius: 14, padding: 14,
    minHeight: 150, maxWidth: '50%',
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  pinBadge: { fontSize: 12, marginBottom: 4, alignSelf: 'flex-start' },
  noteTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6, lineHeight: 20 },
  noteContent: { fontSize: 13, lineHeight: 19, flex: 1 },
  noteDivider: { height: 1, marginVertical: 8 },
  noteDate: { fontSize: 10, lineHeight: 14 },

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
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sortBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 36,
  },
  sortTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  sortOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 10, marginBottom: 4,
  },
  sortOptionActive: { backgroundColor: '#EEF4FF' },
  sortOptionIcon: { fontSize: 18, marginRight: 12 },
  sortOptionText: { flex: 1, fontSize: 15, color: '#444' },
  sortOptionTextActive: { color: '#1565C0', fontWeight: '700' },
  checkmark: { fontSize: 16, color: '#1565C0', fontWeight: '700' },
});
