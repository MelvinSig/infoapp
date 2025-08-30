import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Snackbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILES_KEY = 'userProfiles';
const PROFILE_KEY = 'userProfile'; // legacy single-profile key (migration)
const ACTIVE_PROFILE = 'activeProfile';
import CryptoJS from 'crypto-js';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setStatusMessage('Checking credentials...');
      // yield to allow the UI to show the spinner on web
      await new Promise((r) => setTimeout(r, 40));
      // Load profiles list (migrate legacy single-profile if needed)
      let profilesRaw = await AsyncStorage.getItem(PROFILES_KEY);
      let profiles = profilesRaw ? JSON.parse(profilesRaw) : [];
      if (!profiles.length) {
        const legacy = await AsyncStorage.getItem(PROFILE_KEY);
        if (legacy) profiles = [JSON.parse(legacy)];
      }

      if (!profiles.length) {
        const msg = 'No registered user found. Please register first.';
        console.debug('[Login] no profiles in storage');
        setSnackbarMessage(msg);
        setSnackbarVisible(true);
        setLoading(false);
        return;
      }

      const emailLookup = (email || '').trim().toLowerCase();
      const profile = profiles.find((p) => (p.email || '').trim().toLowerCase() === emailLookup);
      if (!profile) {
        const msg = 'No registered user found with that email. Please register first.';
        console.debug('[Login] profile not found for', emailLookup);
        setSnackbarMessage(msg);
        setSnackbarVisible(true);
        setLoading(false);
        return;
      }
  // normalize inputs
  const passwordTrim = (password || '').trim();
  // handle hashed password: stored passwords should be SHA256 hex (length 64)
  const inputHash = CryptoJS.SHA256(passwordTrim).toString(CryptoJS.enc.Hex);

      // If stored password looks like plaintext (not 64 hex chars), migrate it.
      let storedPassword = profile.password;
      if (storedPassword && !(storedPassword.length === 64 && /^[0-9a-fA-F]+$/.test(storedPassword))) {
        const migratedHash = CryptoJS.SHA256(storedPassword).toString(CryptoJS.enc.Hex);
        // save migrated hash back into profiles array and persist
        profile.password = migratedHash;
        const idx = profiles.findIndex((p) => (p.email || '').trim().toLowerCase() === (profile.email || '').trim().toLowerCase());
        if (idx > -1) profiles[idx] = profile;
        await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
        // keep plaintext fallback value for this check
      }

  const storedEmail = (profile.email || '').trim().toLowerCase();

  // Accept if stored password (now migrated) matches inputHash OR if original plaintext matched trimmed input
  const migratedHashPresent = profile.password && profile.password.length === 64;
  const migratedHash = migratedHashPresent ? profile.password : null;

  const plaintextMatch = storedPassword && storedPassword === passwordTrim;
  const hashMatch = migratedHash && migratedHash === inputHash;

  console.debug('[Login] storedEmail', storedEmail, 'plaintextMatch', !!plaintextMatch, 'hashMatch', !!hashMatch);
  if (storedEmail && (plaintextMatch || hashMatch) && storedEmail === emailLookup) {
        // set active profile for session (used to show/hide admin tab)
        await AsyncStorage.setItem(ACTIVE_PROFILE, JSON.stringify(profile));
        setStatusMessage('Logged in');
        setLoading(false);
        navigation.replace('Main');
      } else {
        const msg = 'Email or password is incorrect.';
        console.debug('[Login] password mismatch for', emailLookup);
        setSnackbarMessage(msg);
        setSnackbarVisible(true);
        setLoading(false);
      }
    } catch (err) {
      const msg = `Failed to access storage: ${err?.message || err}`;
      setSnackbarMessage(msg);
      setSnackbarVisible(true);
      Alert.alert('Error', msg);
      setLoading(false);
    }
  };

  // dev restore removed

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log in</Text>
        </TouchableOpacity>

  {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> : null}
  {statusMessage ? <Text style={{ textAlign: 'center', marginTop: 8 }}>{statusMessage}</Text> : null}

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>New user? Register here</Text>
        </TouchableOpacity>

  {/* dev restore removed */}
      </View>
      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={2000}>
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#f9f9f9' },
  inner: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, marginBottom: 6 },
  input: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ccc' },
  button: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 6 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  link: { marginTop: 14, alignItems: 'center' },
  linkText: { color: '#007bff' },
});

export default LoginScreen;