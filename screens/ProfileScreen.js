import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Snackbar } from 'react-native-paper';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from '@react-navigation/native';

const PROFILES_KEY = "userProfiles";
const PROFILE_KEY = 'userProfile'; // legacy single-profile key

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    email: "",
    rank: "",
    fullName: "",
    nric: "",
    parentUnit: "",
    subUnit: "",
    courseCode: "",
    contactNumber: "",
    pesStatus: "",
    password: "",
    isAdmin: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Load profile from local storage when this screen is focused
  const isFocused = useIsFocused();
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // prefer activeProfile for editing session
        const active = await AsyncStorage.getItem('activeProfile');
        if (active) {
          setProfile(JSON.parse(active));
          return;
        }
        const storedProfile = await AsyncStorage.getItem(PROFILE_KEY);
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
      } catch (error) {
        Alert.alert("Error", "Failed to load profile.");
      }
    };
    if (isFocused) loadProfile();
  }, [isFocused]);

  // Handle input changes
  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  // Save profile to AsyncStorage
  const handleSave = async () => {
    try {
      setLoading(true);
      setSnackbarMessage('');
      // allow UI to render spinner on web
      await new Promise((r) => setTimeout(r, 40));
      // admin elevation removed; preserve profile fields only
      // update profiles list if present
      const raw = await AsyncStorage.getItem(PROFILES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((p) => (p.email || '').trim().toLowerCase() === (profile.email || '').trim().toLowerCase());
      if (idx > -1) list[idx] = profile; else list.push(profile);
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(list));
      // update active session
      await AsyncStorage.setItem('activeProfile', JSON.stringify(profile));
      // show non-blocking confirmation
      setSnackbarMessage('Profile saved successfully!');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('[Profile] save error', error);
      setSnackbarMessage('Failed to save profile.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('activeProfile');
      await AsyncStorage.removeItem('ADMIN_AUTH');
      navigation.replace('Login');
    } catch (err) {
      Alert.alert('Error', 'Logout failed.');
    }
  };

  const handleRevokeAdmin = async () => {
    try {
      const updated = { ...profile, isAdmin: false };
      setProfile(updated);
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
      // also clear activeProfile if it was the active one
      const active = await AsyncStorage.getItem('activeProfile');
      if (active) {
        const p = JSON.parse(active);
        if ((p.email || '').toLowerCase() === (updated.email || '').toLowerCase()) {
          await AsyncStorage.setItem('activeProfile', JSON.stringify(updated));
        }
      }
  setSnackbarMessage('Admin privileges revoked for this account.');
  setSnackbarVisible(true);
    } catch (e) {
  setSnackbarMessage('Failed to revoke admin.');
  setSnackbarVisible(true);
    }
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Edit Profile</Text>

      {/** Registered Email */}
      <Text style={styles.label}>Registered Email:</Text>
      <TextInput
        style={[styles.input, styles.disabledInput]}
        value={profile.email}
        editable={false}
        placeholder="Registered Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/** Login Password */}
      <Text style={styles.label}>Login Password:</Text>
      <TextInput
        style={styles.input}
        value={profile.password}
        onChangeText={(text) => handleChange("password", text)}
        placeholder="Enter Password"
        secureTextEntry={!showPassword}
        onFocus={() => setShowPassword(true)}
        onBlur={() => setShowPassword(false)}
      />
      <Text style={styles.note}>The password is hidden by default — tap the field to reveal it while editing.</Text>

      {/** Rank */}
      <Text style={styles.label}>Rank:</Text>
      <TextInput
        style={styles.input}
        value={profile.rank}
        onChangeText={(text) => handleChange("rank", text)}
        placeholder="Enter Rank"
      />

      {/** Full Name */}
      <Text style={styles.label}>Full Name:</Text>
      <TextInput
        style={styles.input}
        value={profile.fullName}
        onChangeText={(text) => handleChange("fullName", text)}
        placeholder="Enter Full Name"
      />

      {/** Masked NRIC */}
      <Text style={styles.label}>Masked NRIC (Last 4 chars):</Text>
      <TextInput
        style={styles.input}
        value={profile.nric}
        onChangeText={(text) => handleChange("nric", text)}
        placeholder="e.g., 123A"
      />

      {/** Parent Unit */}
      <Text style={styles.label}>Parent Unit:</Text>
      <TextInput
        style={styles.input}
        value={profile.parentUnit}
        onChangeText={(text) => handleChange("parentUnit", text)}
        placeholder="Enter Parent Unit"
      />

      {/** Sub-Unit */}
      <Text style={styles.label}>Sub-Unit:</Text>
      <TextInput
        style={styles.input}
        value={profile.subUnit}
        onChangeText={(text) => handleChange("subUnit", text)}
        placeholder="Enter Sub-Unit"
      />

      {/** Course Code */}
      <Text style={styles.label}>Course Code (If any):</Text>
      <TextInput
        style={styles.input}
        value={profile.courseCode}
        onChangeText={(text) => handleChange("courseCode", text)}
        placeholder="Enter Course Code"
      />

      {/** Contact Number */}
      <Text style={styles.label}>Contact Number:</Text>
      <TextInput
        style={styles.input}
        value={profile.contactNumber}
        onChangeText={(text) => handleChange("contactNumber", text)}
        placeholder="Enter Contact Number"
        keyboardType="phone-pad"
      />

      {/** PES Status */}
      <Text style={styles.label}>PES Status:</Text>
      <TextInput
        style={styles.input}
        value={profile.pesStatus}
        onChangeText={(text) => handleChange("pesStatus", text)}
        placeholder="Enter PES Status"
      />

      {profile.isAdmin && <Text style={{ color: 'green', marginBottom: 8 }}>This account has admin privileges.</Text>}
      {/** Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> : null}
      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={1600}>
        {snackbarMessage}
      </Snackbar>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#eaf6ff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#f2f2f2',
    color: '#666'
  },
  saveButton: {
  marginTop: 12,
  backgroundColor: "#007bff",
  paddingHorizontal: 20,
  borderRadius: 10,
  alignItems: "center",
  width: '90%',
  alignSelf: 'center',
  minWidth: 260,
  height: 52,
  justifyContent: 'center',
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoutButton: {
  marginTop: 12,
  backgroundColor: '#d9534f',
  paddingHorizontal: 20,
  borderRadius: 10,
  alignItems: 'center',
  width: '90%',
  alignSelf: 'center',
  minWidth: 260,
  height: 52,
  justifyContent: 'center',
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

export default ProfileScreen;
