import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const STORAGE_KEY = "SFT_RECORDS";
const HIDE_KEY = "SFT_HIDE_RECORDS"; // to track reset state
const PROFILE_KEY = 'userProfile';

const Sft_recordsScreen = () => {
  const [records, setRecords] = useState([]);

  // Load records from AsyncStorage
  const loadRecords = async () => {
    try {
  // determine current user from active session, fall back to legacy profile
  const activeRaw = await AsyncStorage.getItem('activeProfile');
  const storedProfile = activeRaw ? JSON.parse(activeRaw) : (await AsyncStorage.getItem(PROFILE_KEY)) ? JSON.parse(await AsyncStorage.getItem(PROFILE_KEY)) : null;
  const currentEmail = storedProfile ? storedProfile.email : null;

      const hideFlag = await AsyncStorage.getItem(`${HIDE_KEY}_${currentEmail || 'anon'}`);
      if (hideFlag === "true") {
        setRecords([]); // keep screen cleared for this user
        return;
      }

      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        let parsed = JSON.parse(stored);

        // Migrate legacy records that lack ownerEmail by assigning to current user
        let migrated = false;
        if (currentEmail) {
          parsed = parsed.map((r) => {
            if (!r.hasOwnProperty('ownerEmail') || r.ownerEmail == null) {
              migrated = true;
              return { ...r, ownerEmail: currentEmail };
            }
            return r;
          });
        }

        if (migrated) {
          try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          } catch (e) {
            console.log('Error migrating records:', e);
          }
        }

  // filter by ownerEmail (normalize casing/whitespace)
  const currentNorm = currentEmail ? (currentEmail || '').trim().toLowerCase() : null;
  parsed = parsed.filter((r) => (r.ownerEmail || '').trim().toLowerCase() === currentNorm);
        parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setRecords(parsed);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.log("Error loading records:", error);
    }
  };

  // Refresh whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [])
  );

  // Calculate duration only if endTime exists
  const calculateDuration = (startISO, endISO) => {
    if (!endISO) return ""; // Ongoing session
    const start = new Date(startISO);
    const end = new Date(endISO);
    let diff = (end - start) / 1000; // seconds
    const hours = Math.floor(diff / 3600);
    diff %= 3600;
    const minutes = Math.floor(diff / 60);
    const seconds = Math.floor(diff % 60);
    return `${hours.toString().padStart(2,"0")}:${minutes.toString().padStart(2,"0")}:${seconds.toString().padStart(2,"0")}`;
  };

  // Reset only screen state, and persist reset flag
  const resetScreenRecords = async () => {
    setRecords([]);
  const storedProfile = await AsyncStorage.getItem(PROFILE_KEY);
  const currentEmail = storedProfile ? JSON.parse(storedProfile).email : null;
  await AsyncStorage.setItem(`${HIDE_KEY}_${currentEmail || 'anon'}`, "true");
  };

  // Retrieve records again, and clear reset flag
  const retrieveRecords = async () => {
  const storedProfile = await AsyncStorage.getItem(PROFILE_KEY);
  const currentEmail = storedProfile ? JSON.parse(storedProfile).email : null;
  await AsyncStorage.removeItem(`${HIDE_KEY}_${currentEmail || 'anon'}`);
    loadRecords();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My SFT Records</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.resetButton} onPress={resetScreenRecords}>
          <Text style={styles.buttonText}>Reset Screen</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.retrieveButton} onPress={retrieveRecords}>
          <Text style={styles.buttonText}>Retrieve Records</Text>
        </TouchableOpacity>
      </View>

      {records.length === 0 && <Text>No records found.</Text>}

      {records.map((rec, idx) => (
        <View key={idx} style={styles.recordCard}>
          <Text style={styles.recordText}>
            <Text style={styles.bold}>Training:</Text> {rec.trainingType}
          </Text>
          <Text style={styles.recordText}>
            <Text style={styles.bold}>Start:</Text>{" "}
            {rec.startTime ? new Date(rec.startTime).toLocaleTimeString() : ""}
          </Text>
          <Text style={styles.recordText}>
            <Text style={styles.bold}>End:</Text>{" "}
            {rec.endTime ? new Date(rec.endTime).toLocaleTimeString() : ""}
          </Text>
          <Text style={styles.recordText}>
            <Text style={styles.bold}>Duration:</Text>{" "}
            {calculateDuration(rec.startTime, rec.endTime)}
          </Text>
          <Text style={styles.recordText}>
            <Text style={styles.bold}>Date:</Text>{" "}
            {new Date(rec.timestamp).toLocaleString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  resetButton: {
    backgroundColor: "red",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  retrieveButton: {
    backgroundColor: "green",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  recordCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  recordText: { fontSize: 16, marginBottom: 5 },
  bold: { fontWeight: "bold" },
});

export default Sft_recordsScreen;
