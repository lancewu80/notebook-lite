import React, { useState, useLayoutEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { useNotes } from '../context/NoteContext';

export const NOTE_COLORS = [
  { hex: '#FFFFFF', label: '白色' },
  { hex: '#FFD93D', label: '黃色' },
  { hex: '#6BCB77', label: '綠色' },
  { hex: '#4D96FF', label: '藍色' },
  { hex: '#FF6B6B', label: '紅色' },
  { hex: '#C77DFF', label: '紫色' },
  { hex: '#FFB347', label: '橙色' },
  { hex: '#A8DADC', label: '青色' },
  { hex: '#F4A261', label: '桃色' },
  { hex: '#1a1a2e', label: '深黑' },
];

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function getContrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a2e' : '#ffffff';
}

function wordCount(text) {
  if (!text || !text.trim()) return { chars: 0, words: 0 };
  const chars = text.length;
  // Count words: split by whitespace/punctuation for CJK-aware counting
  const words = text.trim().split(/[\s\n\r]+/).filter(Boolean).length;
  return { chars, words };
}

export default function NoteEditorScreen({ navigation, route }) {
  const { noteId, categoryId } = route.params ?? {};
  const { notes, addNote, updateNote, togglePin } = useNotes();

  const existingNote = noteId ? notes.find(n => n.id === noteId) : null;

  const [title, setTitle] = useState(existingNote?.title ?? '');
  const [content, setContent] = useState(existingNote?.content ?? '');
  const [color, setColor] = useState(existingNote?.color ?? '#FFD93D');
  const [pinned, setPinned] = useState(existingNote?.pinned ?? false);

  const textColor = getContrastColor(color);
  const isDark = textColor === '#ffffff';
  const inputTextColor = isDark ? '#f0f0f0' : '#1a1a2e';
  const placeholderColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.3)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
  const metaColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';

  const { chars, words } = wordCount(content);

  const handleSave = useCallback(async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('提示', '標題和內容不能都是空白的');
      return;
    }
    if (existingNote) {
      await updateNote(existingNote.id, { title, content, color, pinned });
    } else {
      await addNote(categoryId, { title, content, color, pinned });
    }
    navigation.goBack();
  }, [title, content, color, pinned, existingNote, categoryId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: existingNote ? '編輯筆記' : '新增筆記',
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 4 }}>
          {/* Pin toggle */}
          <TouchableOpacity
            onPress={() => setPinned(p => !p)}
            style={{ padding: 4 }}
          >
            <Text style={{ fontSize: 18, opacity: pinned ? 1 : 0.4 }}>📌</Text>
          </TouchableOpacity>
          {/* Save */}
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>儲存</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [handleSave, existingNote, navigation, pinned]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: color }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pinned banner */}
          {pinned && (
            <View style={[styles.pinnedBanner, { borderColor: dividerColor }]}>
              <Text style={[styles.pinnedText, { color: metaColor }]}>📌 已釘選</Text>
            </View>
          )}

          {/* Color Picker */}
          <View style={styles.colorSection}>
            <Text style={[styles.sectionLabel, { color: metaColor }]}>選擇顏色</Text>
            <View style={styles.colorRow}>
              {NOTE_COLORS.map(c => (
                <TouchableOpacity
                  key={c.hex}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c.hex },
                    color === c.hex && styles.colorSwatchActive,
                    c.hex === '#FFFFFF' && styles.colorSwatchBorder,
                  ]}
                  onPress={() => setColor(c.hex)}
                  accessibilityLabel={c.label}
                >
                  {color === c.hex && (
                    <Text style={{ fontSize: 13, color: getContrastColor(c.hex) }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* Title */}
          <TextInput
            style={[styles.titleInput, { color: inputTextColor }]}
            placeholder="標題"
            placeholderTextColor={placeholderColor}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            returnKeyType="next"
          />

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* Content */}
          <TextInput
            style={[styles.contentInput, { color: inputTextColor }]}
            placeholder="在此輸入筆記內容..."
            placeholderTextColor={placeholderColor}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          {/* Word Count */}
          <View style={[styles.wordCountBar, { borderTopColor: dividerColor }]}>
            <Text style={[styles.wordCountText, { color: metaColor }]}>
              {chars} 字元 · {words} 字
            </Text>
          </View>

          {/* Timestamps */}
          <View style={[styles.timestampSection, { borderTopColor: dividerColor }]}>
            {existingNote ? (
              <>
                <View style={styles.timestampRow}>
                  <Text style={[styles.timestampLabel, { color: metaColor }]}>建立時間</Text>
                  <Text style={[styles.timestampValue, { color: metaColor }]}>
                    {formatDateTime(existingNote.createdAt)}
                  </Text>
                </View>
                <View style={styles.timestampRow}>
                  <Text style={[styles.timestampLabel, { color: metaColor }]}>更新時間</Text>
                  <Text style={[styles.timestampValue, { color: metaColor }]}>
                    {formatDateTime(existingNote.updatedAt)}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={[styles.timestampLabel, { color: metaColor }]}>儲存後將記錄建立時間</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 18, paddingBottom: 48 },

  headerBtn: { paddingHorizontal: 4 },
  headerBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  pinnedBanner: {
    borderWidth: 1, borderRadius: 8, paddingVertical: 6,
    paddingHorizontal: 12, marginBottom: 14,
    alignSelf: 'flex-start',
  },
  pinnedText: { fontSize: 12, fontWeight: '600' },

  colorSection: { marginBottom: 14 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 10,
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorSwatchActive: { borderColor: '#1a1a2e', transform: [{ scale: 1.18 }] },
  colorSwatchBorder: { borderColor: '#ddd' },

  divider: { height: 1, marginVertical: 12 },

  titleInput: {
    fontSize: 24, fontWeight: '700',
    paddingVertical: 6, lineHeight: 32,
  },

  contentInput: {
    fontSize: 16, lineHeight: 26,
    minHeight: 180, paddingTop: 4,
  },

  wordCountBar: {
    borderTopWidth: 1, paddingTop: 8, marginTop: 8,
    alignItems: 'flex-end',
  },
  wordCountText: { fontSize: 11 },

  timestampSection: {
    marginTop: 16, paddingTop: 14, borderTopWidth: 1, gap: 6,
  },
  timestampRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timestampLabel: { fontSize: 12, fontWeight: '600' },
  timestampValue: { fontSize: 12 },
});
