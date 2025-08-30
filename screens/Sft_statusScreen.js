import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const STORAGE_KEY = "SFT_RECORDS";
const PROFILE_KEY = 'userProfile';
const trainingTypes = ["Run", "Swim", "Gym", "Metabolic Exercise"];

const Sft_statusScreen = () => {
  const [trainingType, setTrainingType] = useState("Run");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const navigation = useNavigation();

  // Load ongoing session (only if it was started and not ended)
  const loadOngoing = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
        let records = stored ? JSON.parse(stored) : [];

        // Migrate legacy records to current user if necessary
        const storedProfileForMigration = await AsyncStorage.getItem(PROFILE_KEY);
        const currentEmailForMigration = storedProfileForMigration ? JSON.parse(storedProfileForMigration).email : null;
        let migrated = false;
        if (currentEmailForMigration && records.length) {
          records = records.map((r) => {
            if (!r.hasOwnProperty('ownerEmail') || r.ownerEmail == null) {
              migrated = true;
              return { ...r, ownerEmail: currentEmailForMigration };
            }
            return r;
          });
        }
        if (migrated) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        }
// Read current logged-in user email from active session (fall back to legacy PROFILE_KEY)
const activeRaw = await AsyncStorage.getItem('activeProfile');
const storedProfile = activeRaw ? JSON.parse(activeRaw) : (await AsyncStorage.getItem(PROFILE_KEY)) ? JSON.parse(await AsyncStorage.getItem(PROFILE_KEY)) : null;
const currentEmail = storedProfile ? storedProfile.email : null;
const currentNorm = currentEmail ? (currentEmail || '').trim().toLowerCase() : null;

// ✅ Only restore ongoing record that belongs to current user (normalized)
const ongoing = records.find((r) => r.isActive && ((r.ownerEmail || '').trim().toLowerCase() === currentNorm));
      if (ongoing) {
        setTrainingType(ongoing.trainingType);
        setStartTime(new Date(ongoing.startTime));
        setRecordId(ongoing.timestamp);
      } else {
        setStartTime(null);
        setEndTime(null);
        setRecordId(null);
      }
    } catch (error) {
      console.log("Error loading ongoing session:", error);
    }
  };

  // Refresh whenever the SFT status screen is focused (handles re-login scenario)
  useFocusEffect(
    useCallback(() => {
      loadOngoing();
    }, [])
  );

  // Save or update record
  const saveRecord = async (newRecord) => {
    try {
  // attach owner email from stored profile
  const activeRaw = await AsyncStorage.getItem('activeProfile');
  const storedProfile = activeRaw ? JSON.parse(activeRaw) : (await AsyncStorage.getItem(PROFILE_KEY)) ? JSON.parse(await AsyncStorage.getItem(PROFILE_KEY)) : null;
  const currentEmail = storedProfile ? storedProfile.email : null;
  newRecord.ownerEmail = currentEmail;

  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const records = stored ? JSON.parse(stored) : [];

      const existingIndex = records.findIndex(
        (r) => r.timestamp === newRecord.timestamp
      );

      if (existingIndex > -1) {
        records[existingIndex] = newRecord;
      } else {
        records.push(newRecord);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      console.log("Error saving record:", error);
    }
  };

  // Training type selection
  const handleTrainingTypeChange = (type) => {
    setTrainingType(type);

    if (startTime && recordId) {
      saveRecord({
        trainingType: type,
        startTime: startTime.toISOString(),
        endTime: endTime ? endTime.toISOString() : null,
        timestamp: recordId,
        isActive: true,
      });
    }
  };

  // Start session — ensure recent Health Declaration (within 10 minutes)
  const handleStart = async () => {
    try {
      // Try to read per-user health declaration first
      const activeRaw = await AsyncStorage.getItem('activeProfile');
      const storedProfile = activeRaw ? JSON.parse(activeRaw) : (await AsyncStorage.getItem(PROFILE_KEY)) ? JSON.parse(await AsyncStorage.getItem(PROFILE_KEY)) : null;
      const currentEmail = storedProfile ? storedProfile.email : null;
      const norm = currentEmail ? ('' + currentEmail).trim().toLowerCase() : null;
      const userKey = norm ? `healthData_${norm}` : 'healthData';
      const raw = await AsyncStorage.getItem(userKey) || await AsyncStorage.getItem('healthData');
      const parsed = raw ? JSON.parse(raw) : null;
      const incompleteMsg = 'Please complete the Health Declaration before starting training.';
      const tooOldMsg = 'Your Health Declaration is older than 10 minutes. Please complete a new declaration before starting.';

      let promptMsg = null;
      if (!parsed || !Array.isArray(parsed.answers) || parsed.answers.length === 0 || parsed.answers.includes(null)) {
        promptMsg = incompleteMsg;
      } else if (!parsed.timestamp || (new Date() - new Date(parsed.timestamp)) > 10 * 60 * 1000) {
        promptMsg = tooOldMsg;
      }

      if (promptMsg) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert(promptMsg);
          const open = window.confirm('Open Health Declaration now?');
          if (open) navigation.navigate('HealthHome');
        } else {
          Alert.alert('Health required', promptMsg, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open', onPress: () => navigation.navigate('HealthHome') },
          ]);
        }
        return;
      }
    } catch (e) {
      console.log('health check error', e);
      const msg = 'Unable to verify Health Declaration. Please complete it before starting.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
        const open = window.confirm('Open Health Declaration now?');
        if (open) navigation.navigate('HealthHome');
      } else {
        Alert.alert('Health required', msg, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open', onPress: () => navigation.navigate('HealthHome') },
        ]);
      }
      return;
    }

    if (recordId) {
      Alert.alert("Error", "You already have an active session.");
      return;
    }

    const now = new Date();
    setStartTime(now);
    setEndTime(null);

    const timestamp = now.toISOString();
    setRecordId(timestamp);

    saveRecord({
      trainingType,
      startTime: now.toISOString(),
      endTime: null,
      timestamp,
      isActive: true, // ✅ mark as active
    });
  };

  // End session
  const handleEnd = () => {
    if (!startTime || !recordId) {
      Alert.alert("Error", "Please start a session first.");
      return;
    }

    const now = new Date();
    setEndTime(now);

    saveRecord({
      trainingType,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      timestamp: recordId,
      isActive: false, // ✅ mark as inactive
    });

    // Reset local state
    setStartTime(null);
    setEndTime(null);
    setRecordId(null);
    Alert.alert("Success", "Session completed!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Self-Regulated Fitness Training</Text>

      <Text style={styles.label}>Select Training Type:</Text>
      <View style={styles.buttonRow}>
        {trainingTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              trainingType === type && styles.typeButtonSelected,
            ]}
            onPress={() => handleTrainingTypeChange(type)}
          >
            <Text
              style={[
                styles.typeButtonText,
                trainingType === type && styles.typeButtonTextSelected,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Start Button */}
      <Text style={styles.label}>Start Time:</Text>
      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>
      {startTime && (
        <Text style={styles.timeText}>{startTime.toLocaleTimeString()}</Text>
      )}

      {/* End Button */}
      <Text style={styles.label}>End Time:</Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "red" }]}
        onPress={handleEnd}
      >
        <Text style={styles.buttonText}>End</Text>
      </TouchableOpacity>
      {endTime && (
        <Text style={styles.timeText}>{endTime.toLocaleTimeString()}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#eaf6ff" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: { fontSize: 16, marginTop: 15, marginBottom: 5 },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007bff",
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  typeButtonSelected: { backgroundColor: "#007bff" },
  typeButtonText: { color: "#007bff", fontWeight: "bold" },
  typeButtonTextSelected: { color: "#fff" },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  timeText: { marginTop: 5, fontSize: 16, color: "#333" },
});

export default Sft_statusScreen;
