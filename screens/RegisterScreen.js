import React, { useState, useEffect } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Snackbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

const PROFILES_KEY = 'userProfiles';
const PROFILE_KEY = 'userProfile'; // legacy

const RegisterScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    email: '',
    rank: '',
    fullName: '',
    nric: '',
    parentUnit: '',
    subUnit: '',
    courseCode: '',
    contactNumber: '',
    pesStatus: '',
    password: '',
    isAdmin: false,
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const restoreMelvin = async () => {
    try {
      const email = 'melvin@test.com';
      const password = '1234';
      const hash = CryptoJS.SHA256((password || '').trim()).toString(CryptoJS.enc.Hex);
      const profileObj = { email: email.trim().toLowerCase(), password: hash, isAdmin: true };
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify([profileObj]));
      await AsyncStorage.setItem('activeProfile', JSON.stringify(profileObj));
      Alert.alert('Restored', 'melvin@test.com created with password 1234 (dev)', [
        { text: 'OK', onPress: () => navigation.replace('Login') },
      ]);
    } catch (e) {
      Alert.alert('Error', `Restore failed: ${e?.message || e}`);
    }
  };

  {/* dev restore removed */}
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(PROFILE_KEY);
        if (stored) {
          const loaded = JSON.parse(stored);
          // don't pre-fill the password field with stored (hashed) value
          loaded.password = '';
          setProfile(loaded);
        }
      } catch (e) {}
    };
    load();
  }, []);

  const handleChange = (field, value) => setProfile({ ...profile, [field]: value });

  const handleRegister = async () => {
    if (!profile.email || !profile.password) {
      Alert.alert('Missing', 'Email and password are required.');
      return;
    }
    try {
      setLoading(true);
      setStatusMessage('Saving registration...');
      // yield to allow the UI to render the saving state on web before heavy work
      await new Promise((resolve) => setTimeout(resolve, 50));
  // normalize email
  const normalizedEmail = (profile.email || '').trim().toLowerCase();
  // hash password before saving
  const hash = CryptoJS.SHA256((profile.password || '').trim()).toString(CryptoJS.enc.Hex);
  // Ensure new registrations are not accidentally given admin rights
  const saveProfile = { ...profile, email: normalizedEmail, password: hash, isAdmin: false };
      // load existing profiles list
      const raw = await AsyncStorage.getItem(PROFILES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      // if email exists, replace, else push
      const idx = list.findIndex((p) => (p.email || '').trim().toLowerCase() === normalizedEmail);
      if (idx > -1) list[idx] = saveProfile; else list.push(saveProfile);
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(list));
      // Do NOT automatically set the newly registered user as the active session,
      // and do not automatically store as the legacy single-profile. That caused
      // unexpected auto-login / admin elevation on some platforms (web).
      setStatusMessage('Registration saved. You can now log in.');
      // Show a non-blocking snackbar message
      setSnackbarMessage('Registration saved. You can now log in.');
      setSnackbarVisible(true);
      // Auto-dismiss the snackbar and navigate to Login after a short delay
      setTimeout(() => {
        setSnackbarVisible(false);
        try { navigation.replace('Login'); } catch (e) { /* ignore */ }
      }, 1300);
    } catch (e) {
  console.error('[Register] save error', e);
  setStatusMessage(`Error: ${e?.message || e}`);
  Alert.alert('Error', `Failed to save registration: ${e?.message || e}`);
    }
    finally {
      setLoading(false);
    }
  };

  const reseedAdmin = async () => {
    try {
      const email = 'admin@test.com';
      const password = '1234';
      const hash = CryptoJS.SHA256((password || '').trim()).toString(CryptoJS.enc.Hex);
      const profileObj = { email: email.trim().toLowerCase(), password: hash, isAdmin: true };
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profileObj));
      await AsyncStorage.setItem('activeProfile', JSON.stringify(profileObj));
      Alert.alert('Reseeded', 'Admin account created: admin@test.com / 1234', [
        { text: 'OK', onPress: () => navigation.replace('Login') },
      ]);
    } catch (e) {
      Alert.alert('Error', `Reseed failed: ${e?.message || e}`);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Register</Text>

        <Text style={styles.label}>Registered Email:</Text>
        <TextInput style={styles.input} value={profile.email} onChangeText={(t) => handleChange('email', t)} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>Login Password:</Text>
        <TextInput style={styles.input} value={profile.password} onChangeText={(t) => handleChange('password', t)} secureTextEntry />

        <Text style={styles.label}>Rank:</Text>
        <TextInput style={styles.input} value={profile.rank} onChangeText={(t) => handleChange('rank', t)} />

        <Text style={styles.label}>Full Name:</Text>
        <TextInput style={styles.input} value={profile.fullName} onChangeText={(t) => handleChange('fullName', t)} />

        <Text style={styles.label}>Masked NRIC (Last 4 chars):</Text>
        <TextInput style={styles.input} value={profile.nric} onChangeText={(t) => handleChange('nric', t)} />

        <Text style={styles.label}>Parent Unit:</Text>
        <TextInput style={styles.input} value={profile.parentUnit} onChangeText={(t) => handleChange('parentUnit', t)} />

        <Text style={styles.label}>Sub-Unit:</Text>
        <TextInput style={styles.input} value={profile.subUnit} onChangeText={(t) => handleChange('subUnit', t)} />

        <Text style={styles.label}>Course Code (If any):</Text>
        <TextInput style={styles.input} value={profile.courseCode} onChangeText={(t) => handleChange('courseCode', t)} />

        <Text style={styles.label}>Contact Number:</Text>
        <TextInput style={styles.input} value={profile.contactNumber} onChangeText={(t) => handleChange('contactNumber', t)} keyboardType="phone-pad" />

        <Text style={styles.label}>PES Status:</Text>
        <Text style={styles.input} value={profile.pesStatus} onChangeText={(t) => handleChange('pesStatus', t)} />

        <TouchableOpacity style={styles.saveButton} onPress={handleRegister}>
          <Text style={styles.saveText}>Register</Text>
        </TouchableOpacity>

  {loading ? <ActivityIndicator style={{ marginTop: 10 }} /> : null}
  {statusMessage ? <Text style={{ textAlign: 'center', marginTop: 10 }}>{statusMessage}</Text> : null}
  <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={1200}>
    {snackbarMessage}
  </Snackbar>

  {/* reseed button removed */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ccc', fontSize: 16 },
  saveButton: { marginTop: 10, backgroundColor: '#007bff', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

export default RegisterScreen;