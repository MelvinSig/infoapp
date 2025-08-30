import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UNFIT_KEY = 'HEALTH_UNFIT_LOG';

export default function AdminUnfitLogScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [activeIsAdmin, setActiveIsAdmin] = useState(false);
  const [fromDate, setFromDate] = useState(''); // YYYY-MM-DD
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(UNFIT_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        setEntries(parsed);
        // check activeProfile admin flag
        const activeRaw = await AsyncStorage.getItem('activeProfile');
        if (activeRaw) {
          try {
            const ap = JSON.parse(activeRaw);
            setActiveIsAdmin(!!ap.isAdmin);
            if (!ap.isAdmin) {
              Alert.alert('Unauthorized', 'Admin access required to view this screen.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            }
          } catch (e) {
            // ignore parsing errors
          }
        } else {
          Alert.alert('Unauthorized', 'Admin access required to view this screen.', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }
      } catch (e) {
        console.log('load unfit', e);
      } finally {
        setLoading(false);
      }
    };
    const unsubscribe = navigation.addListener('focus', load);
    load();
    return unsubscribe;
  }, [navigation]);

  const clearAll = () => {
    Alert.alert('Confirm', 'Clear all unfit entries?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        try {
          await AsyncStorage.removeItem(UNFIT_KEY);
          setEntries([]);
          Alert.alert('Cleared', 'All unfit entries removed.');
        } catch (e) {
          Alert.alert('Error', 'Failed to clear entries.');
        }
      } }
    ]);
  };

  const toggleExpand = (idx) => {
    setExpandedIndex((prev) => (prev === idx ? null : idx));
  };

  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    let out = entries || [];
    if (q) {
      out = out.filter((e) => {
        const email = (e.ownerEmail || e.email || '').toLowerCase();
        const reason = JSON.stringify(e.failedQuestions || e.answers || e.reason || '').toLowerCase();
        return email.includes(q) || reason.includes(q) || (e.timestamp || '').toLowerCase().includes(q);
      });
    }
    // date range
    const f = (fromDate || '').trim();
    const t = (toDate || '').trim();
    if (f) {
      const fTime = new Date(f + 'T00:00:00').getTime();
      out = out.filter((e) => (e.timestamp ? new Date(e.timestamp).getTime() : 0) >= fTime);
    }
    if (t) {
      const tTime = new Date(t + 'T23:59:59').getTime();
      out = out.filter((e) => (e.timestamp ? new Date(e.timestamp).getTime() : 0) <= tTime);
    }
    return out;
  }, [entries, query, fromDate, toDate]);

  const saveEntries = async (next) => {
    try {
      await AsyncStorage.setItem(UNFIT_KEY, JSON.stringify(next));
      setEntries(next);
    } catch (e) {
      Alert.alert('Error', 'Failed to save changes.');
    }
  };

  const confirmDelete = (entry) => {
    Alert.alert('Confirm', 'Delete this unfit entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const next = (entries || []).filter((e) => !(e.timestamp === entry.timestamp && (e.ownerEmail || e.email) === (entry.ownerEmail || entry.email)));
        await saveEntries(next);
        Alert.alert('Deleted', 'Entry removed.');
      } }
    ]);
  };

  const toggleReviewed = async (entry, mark = true) => {
    const next = (entries || []).map((e) => {
      if (e.timestamp === entry.timestamp && (e.ownerEmail || e.email) === (entry.ownerEmail || entry.email)) {
        return { ...e, reviewed: mark, reviewedAt: mark ? new Date().toISOString() : undefined };
      }
      return e;
    });
    await saveEntries(next);
  };

  const exportJson = async () => {
    try {
      const payload = JSON.stringify(entries || [], null, 2);
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(payload);
        Alert.alert('Exported', 'Unfit log copied to clipboard (web).');
        return;
      }
      // fallback: store a copy under a temporary key and show alert with length
      await AsyncStorage.setItem(`${UNFIT_KEY}_EXPORT`, payload);
      Alert.alert('Exported', `Unfit log saved to AsyncStorage as ${UNFIT_KEY}_EXPORT (${(entries||[]).length} entries).`);
    } catch (e) {
      Alert.alert('Error', 'Failed to export log.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unfit to Train Audit</Text>
      <View style={styles.topRow}>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search by email, reason or date" style={styles.search} />
        <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
          <Text style={styles.clearText}>Clear all</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.dateRow}>
        <TextInput value={fromDate} onChangeText={setFromDate} placeholder="From (YYYY-MM-DD)" style={styles.dateInput} />
        <TextInput value={toDate} onChangeText={setToDate} placeholder="To (YYYY-MM-DD)" style={styles.dateInput} />
      </View>
      <TouchableOpacity style={styles.exportBtn} onPress={exportJson}>
        <Text style={styles.exportText}>Export</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.list}>
        {loading ? <Text>Loading...</Text> : (
          filtered.length === 0 ? <Text style={styles.empty}>No unfit entries found.</Text> : (
            filtered.map((e, i) => (
              <View key={i} style={styles.cardWrap}>
                <TouchableOpacity style={styles.card} onPress={() => toggleExpand(i)}>
                  <View>
                    <Text style={styles.cardTitle}>{e.ownerEmail || e.email || 'unknown'}</Text>
                    <Text style={styles.cardText}>{e.timestamp ? new Date(e.timestamp).toLocaleString() : 'no timestamp'}</Text>
                    {!expandedIndex === i && <Text style={styles.cardSnippet}>{(e.reason || JSON.stringify(e.failedQuestions || e.answers || {})).slice(0, 120)}</Text>}
                    {expandedIndex === i && (
                      <Text style={styles.cardDetail}>{JSON.stringify(e, null, 2)}</Text>
                    )}
                  </View>
                </TouchableOpacity>
                {expandedIndex === i && (
                  <View style={styles.entryActions}>
                    <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#d9534f' }]} onPress={() => confirmDelete(e)}>
                      <Text style={styles.smallBtnText}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.smallBtn, { backgroundColor: e.reviewed ? '#6c757d' : '#28a745' }]} onPress={() => toggleReviewed(e, !e.reviewed)}>
                      <Text style={styles.smallBtnText}>{e.reviewed ? 'Unmark' : 'Mark reviewed'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f7fbff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  search: { flex: 1, backgroundColor: '#fff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  list: { paddingBottom: 40 },
  card: { backgroundColor: '#fff', padding: 10, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: '#e1eaf6' },
  cardTitle: { fontWeight: '700' },
  cardText: { marginTop: 4, color: '#333' },
  cardSnippet: { marginTop: 6, color: '#666' },
  cardDetail: { marginTop: 8, color: '#222', fontFamily: Platform.OS === 'ios' ? 'Courier' : undefined },
  clearBtn: { marginLeft: 8, backgroundColor: '#e24', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6 },
  clearText: { color: '#fff', fontWeight: '700' },
  exportBtn: { position: 'absolute', right: 12, top: 12, backgroundColor: '#2a85ff', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  exportText: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 12, color: '#666' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dateInput: { flex: 1, backgroundColor: '#fff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  cardWrap: { marginBottom: 10 },
  entryActions: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 6 },
  smallBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginLeft: 8 },
  smallBtnText: { color: '#fff', fontWeight: '700' }
});

