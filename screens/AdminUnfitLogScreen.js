import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UNFIT_KEY = 'HEALTH_UNFIT_LOG';
const PROFILES_KEY = 'userProfiles';
const STORAGE_KEY_BASE = 'healthData';

// Same question list as in HealthScreen so we can show the actual texts
const QUESTIONS = [
  'Have you ever experienced a diagnosis of/treatment for heart disease or stroke, or pain/discomfort/pressure in your chest during activities of daily living or during your physical activity within the past 6 months?',
  'Have you ever experienced a diagnosis of/treatment for high blood pressure (BP), or a resting BP of 160/90 mmHg or higher within the past 6 months?',
  'Have you ever experience dizziness or light-headedness during physical activity within the past 6 months?',
  'Have you ever experienced loss of consciousness/fainting for any reason within the past 6 months?',
  'Do you currently have pain or swelling in any part of your body (e.g. from an injury, acute flare-up of arthritis, or back pain) that affects your ability to be physically active?',
  'Has a Healthcare provider told you that you should avoid or modify certain types of physical activity?',
  'Do you have any other medical or physical conditions (such as diabetes, cancer, osteoporosis, asthma, spinal cord injury) that may affect your ability to be physically active?',
  'Have you drank beyond point of thirst?',
  'Do you have any medical excuse, pre-existing medical condition or injury that prevents you from taking part in the activity?',
  'Are you feeling unwell? Example, flu, diarrhea or vomiting in the past 24 hours?',
  'Do you have at least 7 hours of uninterrupted rest?',
  'Is your temperature 37.5°C or higher?',
  'Do you have underlying medical conditions that require medical aid for you to train safely? For example, Asthmatic personnel.'
];

export default function AdminUnfitLogScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(UNFIT_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const profRaw = await AsyncStorage.getItem(PROFILES_KEY);
      const profs = profRaw ? JSON.parse(profRaw) : [];
      setProfiles(profs || []);

      // enrich entries with resolved profile and per-user answers where available
      const enriched = await Promise.all((parsed || []).map(async (entry) => {
        const email = (entry.email || entry.ownerEmail || '') || '';
        let profile = null;
        if (email) {
          const norm = ('' + email).trim().toLowerCase();
          profile = (profs || []).find(p => (p.email || '').toLowerCase() === norm) || null;
          // try to load per-user unfit payloads to get full answers when available
          try {
            const unfitKey = `${STORAGE_KEY_BASE}_${norm}_unfit`;
            const uraw = await AsyncStorage.getItem(unfitKey);
            if (uraw) {
              const list = JSON.parse(uraw);
              if (Array.isArray(list) && list.length > 0) {
                // latest per-user record
                entry._full = list[0];
              }
            }
          } catch (e) {
            // ignore
          }
        }
        return { ...entry, _profile: profile };
      }));

      setEntries(enriched || []);
    } catch (e) {
      console.log('load unfit', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadAll);
    loadAll();
    return unsub;
  }, [navigation, loadAll]);

  const saveEntries = async (list) => {
    try {
      await AsyncStorage.setItem(UNFIT_KEY, JSON.stringify(list));
      setEntries(list);
    } catch (e) {
      Alert.alert('Error', 'Failed to save log.');
    }
  };

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

  const confirmDelete = (idx) => {
    Alert.alert('Delete entry', 'Delete this unfit record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => handleDelete(idx) }
    ]);
  };

  const handleDelete = async (idx) => {
    try {
      const copy = [...entries];
      copy.splice(idx, 1);
      await saveEntries(copy);
      Alert.alert('Deleted', 'Entry removed.');
    } catch (e) {
      Alert.alert('Error', 'Could not delete entry.');
    }
  };

  const toggleReviewed = async (idx) => {
    try {
      const copy = [...entries];
      copy[idx] = { ...copy[idx], reviewed: !copy[idx].reviewed, reviewedAt: !copy[idx].reviewed ? new Date().toISOString() : null };
      await saveEntries(copy);
      Alert.alert('Updated', copy[idx].reviewed ? 'Marked reviewed' : 'Marked unreviewed');
    } catch (e) {
      Alert.alert('Error', 'Could not update entry.');
    }
  };

  const renderFailedQuestions = (entry) => {
    const failed = entry.failedIndices || (entry._full && entry._full.failedIndices) || [];
    const answers = (entry._full && entry._full.answers) || null;
    if (!failed || failed.length === 0) return <Text style={styles.small}>(no failed questions recorded)</Text>;
    return (
      <View style={styles.failedList}>
        {failed.map((i) => (
          <View key={i} style={styles.failedRow}>
            <Text style={styles.failedIndex}>{i + 1}.</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.failedQ}>{QUESTIONS[i]}</Text>
              {answers ? <Text style={styles.answerText}>Answer: {answers[i]}</Text> : null}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>◀ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Unfit to Train Audit</Text>
        <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
          <Text style={styles.clearText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {loading ? <Text>Loading...</Text> : (
          entries.length === 0 ? <Text style={styles.empty}>No unfit entries found.</Text> : (
            entries.map((e, i) => (
              <View key={i} style={[styles.card, e.reviewed ? styles.cardReviewed : null]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>{(e._profile && (e._profile.rank ? e._profile.rank + ' ' : '') + (e._profile.fullName || e._profile.name)) || 'Unknown user'}</Text>
                    <Text style={styles.cardMeta}>{e.timestamp ? new Date(e.timestamp).toLocaleString() : 'no timestamp'}</Text>
                    <Text style={styles.cardSmall}>{(e._profile && `${e._profile.parentUnit || ''}${e._profile.subUnit ? ' • ' + e._profile.subUnit : ''}`) || ''}</Text>
                  </View>
                  <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => toggleReviewed(i)} style={styles.smallBtn}><Text style={styles.smallBtnText}>{e.reviewed ? 'Unreview' : 'Mark Reviewed'}</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(i)} style={[styles.smallBtn, { backgroundColor: '#f8d7da' }]}><Text style={[styles.smallBtnText, { color: '#a33' }]}>Delete</Text></TouchableOpacity>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.previewText}>{e.preview || ''}</Text>
                  {renderFailedQuestions(e)}
                </View>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backBtn: { padding: 6 },
  backText: { color: '#0b3d91', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', flex: 1 },
  list: { paddingBottom: 40 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#e1eaf6' },
  cardReviewed: { opacity: 0.7, borderColor: '#d0e6d6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontWeight: '700', fontSize: 16 },
  cardMeta: { color: '#556676', marginTop: 2 },
  cardSmall: { color: '#6b7a86', marginTop: 2, fontSize: 12 },
  headerActions: { flexDirection: 'row', gap: 8 },
  smallBtn: { backgroundColor: '#eef6ff', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, marginLeft: 8 },
  smallBtnText: { color: '#0b3d91', fontWeight: '700', fontSize: 12 },
  cardBody: { marginTop: 10 },
  previewText: { color: '#233646', marginBottom: 8 },
  failedList: { marginTop: 6 },
  failedRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  failedIndex: { width: 26, fontWeight: '700', color: '#a33' },
  failedQ: { color: '#333' },
  answerText: { color: '#0b3d91', marginTop: 4, fontWeight: '700' },
  clearBtn: { backgroundColor: '#e24', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  clearText: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 12, color: '#666' },
  small: { color: '#666', fontSize: 12 }
});
