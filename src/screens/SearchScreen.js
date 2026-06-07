import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useNotes } from '../context/NoteContext';

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function getContrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a2e' : '#ffffff';
}

// Highlight matching text
function HighlightText({ text, query, style }) {
  if (!query || !text) return <Text style={style}>{text}</Text>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <Text key={i} style={styles.highlight}>{part}</Text>
          : part
      )}
    </Text>
  );
}

export default function SearchScreen({ navigation }) {
  const { searchNotes, getCategoryById } = useNotes();
  const [query, setQuery] = useState('');
  const results = query.trim().length > 0 ? searchNotes(query) : [];

  const renderItem = useCallback(({ item }) => {
    const cat = getCategoryById(item.categoryId);
    const bg = item.color || '#FFFFFF';
    const textColor = getContrastColor(bg);
    const subColor = textColor === '#1a1a2e' ? '#555' : 'rgba(255,255,255,0.75)';

    return (
      <TouchableOpacity
        style={[styles.resultCard, { backgroundColor: bg }]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('NoteEditor', { noteId: item.id, categoryId: item.categoryId })}
      >
        <View style={styles.cardHeader}>
          <HighlightText
            text={item.title || '無標題'}
            query={query}
            style={[styles.noteTitle, { color: textColor }]}
          />
          {item.pinned && <Text style={styles.pinIcon}>📌</Text>}
        </View>
        {!!item.content && (
          <HighlightText
            text={item.content.length > 100 ? item.content.slice(0, 100) + '…' : item.content}
            query={query}
            style={[styles.noteContent, { color: subColor }]}
          />
        )}
        <View style={styles.cardFooter}>
          <Text style={[styles.categoryTag, { color: subColor }]}>
            📁 {cat ? cat.name : '未知分類'}
          </Text>
          <Text style={[styles.dateText, { color: subColor }]}>
            {formatDateTime(item.updatedAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [query, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="搜尋所有筆記..."
          placeholderTextColor="#aaa"
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            {query.trim().length === 0
              ? <>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyText}>輸入關鍵字搜尋筆記</Text>
                  <Text style={styles.emptySubText}>支援搜尋標題與內容</Text>
                </>
              : <>
                  <Text style={styles.emptyIcon}>😶</Text>
                  <Text style={styles.emptyText}>找不到「{query}」</Text>
                  <Text style={styles.emptySubText}>試試其他關鍵字</Text>
                </>
            }
          </View>
        }
        ListHeaderComponent={
          results.length > 0
            ? <Text style={styles.resultCount}>找到 {results.length} 則筆記</Text>
            : null
        }
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f5' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a2e',
    paddingVertical: 13,
  },
  clearBtn: { padding: 4 },
  clearText: { fontSize: 14, color: '#999' },

  list: { paddingHorizontal: 16, paddingBottom: 40 },

  resultCount: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    marginLeft: 2,
    fontWeight: '600',
  },

  resultCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noteTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  pinIcon: { fontSize: 14, marginLeft: 6 },
  noteContent: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryTag: { fontSize: 11, fontWeight: '600' },
  dateText: { fontSize: 11 },

  highlight: {
    backgroundColor: '#FFD93D',
    color: '#1a1a2e',
    fontWeight: '700',
  },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#555' },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 6 },
});
