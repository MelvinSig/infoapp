import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UNFIT_KEY = 'HEALTH_UNFIT_LOG';

export default function AdminUnfitLogScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(UNFIT_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        setEntries(parsed);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unfit to Train Audit</Text>
      <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
        <Text style={styles.clearText}>Clear all</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.list}>
        {loading ? <Text>Loading...</Text> : (
          entries.length === 0 ? <Text style={styles.empty}>No unfit entries found.</Text> : (
            entries.map((e, i) => (
              <View key={i} style={styles.card}>
                <Text style={styles.cardTitle}>{e.ownerEmail || e.email || 'unknown'}</Text>
                <Text style={styles.cardText}>{e.timestamp ? new Date(e.timestamp).toLocaleString() : 'no timestamp'}</Text>
                <Text style={styles.cardText}>{e.reason || JSON.stringify(e.failedQuestions || e.answers || {})}</Text>
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7fbff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  list: { paddingBottom: 40 },
  card: { backgroundColor: '#fff', padding: 10, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: '#e1eaf6' },
  cardTitle: { fontWeight: '700' },
  cardText: { marginTop: 4, color: '#333' },
  clearBtn: { position: 'absolute', right: 16, top: 12, backgroundColor: '#e24', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  clearText: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 12, color: '#666' }
});
