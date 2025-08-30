import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const STORAGE_KEY = 'SFT_RECORDS';
const PROFILES_KEY = 'userProfiles';
const HIDE_KEY = 'SFT_HIDE_RECORDS';
const ADMIN_AUDIT = 'ADMIN_AUDIT_LOG';

const AdminScreen = () => {
  const [email, setEmail] = useState('');
  const [allRecords, setAllRecords] = useState([]);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [grantEmail, setGrantEmail] = useState('');
  
  const [auditLog, setAuditLog] = useState([]);
  const [showAudit, setShowAudit] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [activeButtons, setActiveButtons] = useState({});
  const [todayOpenRecords, setTodayOpenRecords] = useState([]);
  const [todayClosedRecords, setTodayClosedRecords] = useState([]);
  const [showOpenToday, setShowOpenToday] = useState(false);
  const [showClosedToday, setShowClosedToday] = useState(false);
  const [closedSortField, setClosedSortField] = useState('timestamp'); // 'start' | 'end' | 'timestamp'
  const [closedSortAsc, setClosedSortAsc] = useState(false);
  const [activeProfileEmail, setActiveProfileEmail] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const active = await AsyncStorage.getItem('activeProfile');
      if (active) {
        const p = JSON.parse(active);
        setAdminLoggedIn(!!p.isAdmin);
  setActiveProfileEmail(p.email || null);
      }
    };
    checkAuth();
  }, []);
    const navigation = useNavigation();

    // ensure header title is centered when the header is shown by the navigator
    useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: 'Admin', headerTitleAlign: 'center' });
    }, [navigation]);

  const toggleActive = (key) => {
    setActiveButtons((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // cross-platform confirm helper: use native Alert on mobile, window.confirm on web
  const confirmAction = (title, message, onConfirm, okLabel = 'OK') => {
    if (Platform.OS === 'web') {
      try {
        const ok = window.confirm(message);
        if (ok && typeof onConfirm === 'function') onConfirm();
      } catch (e) {
        // fallback to Alert
        Alert.alert(title, message, [
          { text: 'Cancel', style: 'cancel' },
          { text: okLabel, onPress: onConfirm },
        ]);
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: okLabel, onPress: onConfirm },
      ]);
    }
  };

  const recordAudit = async (action) => {
    try {
      const active = await AsyncStorage.getItem('activeProfile');
      const adminEmail = active ? JSON.parse(active).email : 'unknown';
      const entry = { action, adminEmail, timestamp: new Date().toISOString() };
      const stored = await AsyncStorage.getItem(ADMIN_AUDIT);
      const parsed = stored ? JSON.parse(stored) : [];
      parsed.unshift(entry);
      await AsyncStorage.setItem(ADMIN_AUDIT, JSON.stringify(parsed));
    } catch (e) {
      console.log('audit error', e);
    }
  };

  const adminLogout = async () => {
    // clear activeProfile and admin flag locally
    try {
      await AsyncStorage.removeItem('activeProfile');
      setAdminLoggedIn(false);
      await recordAudit('admin_logout');
    } catch (e) {
      // ignore
    }
  };

  const grantAdminToEmail = async () => {
    if (!adminLoggedIn) return Alert.alert('Admin', 'Only admins can grant admin role.');
    if (!grantEmail) return Alert.alert('Input', 'Enter an email to grant admin.');
    try {
      // update user in userProfiles list
      const raw = await AsyncStorage.getItem(PROFILES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const targetEmail = (grantEmail || '').trim().toLowerCase();
      const idx = list.findIndex((u) => (u.email || '').trim().toLowerCase() === targetEmail);
      if (idx === -1) return Alert.alert('Not found', 'No matching user found in local profiles.');
      list[idx].isAdmin = true;
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(list));
      // if that user is active, update activeProfile
      const active = await AsyncStorage.getItem('activeProfile');
      if (active) {
        const p = JSON.parse(active);
        if ((p.email || '').trim().toLowerCase() === targetEmail) {
          await AsyncStorage.setItem('activeProfile', JSON.stringify(list[idx]));
          setAdminLoggedIn(true);
        }
      }
      await recordAudit(`grant_admin_${grantEmail}`);
      Alert.alert('Granted', `${grantEmail} now has admin privileges on this device.`);
      setGrantEmail('');
    } catch (e) {
      Alert.alert('Error', 'Migration failed.');
    }
  };

  const searchUser = async () => {
    const term = (grantEmail || '').trim().toLowerCase();
    if (!term) return Alert.alert('Input', 'Enter an email or name to search.');
    try {
      const raw = await AsyncStorage.getItem(PROFILES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const matches = list.filter((u) => {
        const email = (u.email || '').toLowerCase();
        const name = ((u.fullName || u.name) || '').toLowerCase();
        return email.includes(term) || name.includes(term);
      });
      if (!matches || matches.length === 0) {
        Alert.alert('Not found', `No users matching "${grantEmail}" found.`);
        return;
      }
      // show matched users in the Registered users section
      const sorted = matches.sort((a, b) => ('' + (a.email || '')).localeCompare('' + (b.email || '')));
      setUsersList(sorted);
      setShowUsers(true);
    } catch (e) {
      Alert.alert('Error', 'Search failed.');
    }
  };

  const clearSearch = () => {
    setGrantEmail('');
    setShowUsers(false);
    setUsersList([]);
  };

  // loadAllRecords removed

  const clearUserRecords = async (targetEmail) => {
    const emailToUse = (targetEmail || email || '').trim().toLowerCase();
    if (!adminLoggedIn) return Alert.alert('Admin', 'Please login as admin to run this.');
    if (!emailToUse) {
      Alert.alert('Input required', 'Specify an email to clear records for.');
      return;
    }
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let parsed = stored ? JSON.parse(stored) : [];
      parsed = parsed.filter((r) => (r.ownerEmail || '').trim().toLowerCase() !== emailToUse);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      // clear user's hide flag
      await AsyncStorage.removeItem(`${HIDE_KEY}_${emailToUse}`);
      await recordAudit(`clear_records_${emailToUse}`);
      Alert.alert('Cleared', `Records for ${emailToUse} have been removed.`);
      setAllRecords(parsed);
    } catch (e) {
      Alert.alert('Error', 'Failed to clear records.');
    }
  };

  // exportCsv removed

  const loadAudit = async () => {
    // toggle: if currently shown, hide; otherwise load and show
    if (showAudit) {
      setShowAudit(false);
      setAuditLog([]);
      return;
    }
    if (!adminLoggedIn) return Alert.alert('Admin', 'Please login as admin to run this.');
    try {
      const stored = await AsyncStorage.getItem(ADMIN_AUDIT);
      const parsed = stored ? JSON.parse(stored) : [];
      setAuditLog(parsed);
      setShowAudit(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to load audit log.');
    }
  };

  // Load records for today and split into open (isActive true or no endTime) and closed (isActive false / has endTime)
  const loadTodayRecords = async () => {
    if (!adminLoggedIn) return Alert.alert('Admin', 'Please login as admin to run this.');
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      // also load local profiles to enrich record display
      const profilesRaw = await AsyncStorage.getItem(PROFILES_KEY);
      const profiles = profilesRaw ? JSON.parse(profilesRaw) : [];
      const profileMap = {};
      profiles.forEach(p => {
        if (p && p.email) profileMap[(p.email || '').trim().toLowerCase()] = p;
      });

      // determine start and end of today in local timezone
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const open = [];
      const closed = [];

      parsed.forEach((r) => {
        const ts = r.timestamp ? new Date(r.timestamp) : null;
        if (!ts) return;
        // only records from today
        if (ts >= startOfDay && ts <= endOfDay) {
          const isClosed = !!r.endTime || r.isActive === false;
          // enrich with owner profile if available
          const ownerEmailNorm = (r.ownerEmail || '').trim().toLowerCase();
          const prof = profileMap[ownerEmailNorm];
          const enriched = {
            ...r,
            ownerRank: prof ? prof.rank || '' : '',
            ownerName: prof ? prof.fullName || '' : '',
            ownerParentUnit: prof ? (prof.parentUnit || prof.parent || prof.parent_unit || prof.parentunit || '') : '',
            ownerSubUnit: prof ? (prof.subUnit || prof.sub_unit || prof.subunit || prof.unit || prof.unitName || '') : '',
            ownerUnit: prof ? (prof.parentUnit || prof.unit || prof.unitName || '') : '',
            ownerContact: prof ? (prof.contactNumber || prof.contact || '') : '',
          };
          if (isClosed) closed.push(enriched);
          else open.push(enriched);
        }
      });

      // sort newest first
      open.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      closed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  setTodayOpenRecords(open);
  setTodayClosedRecords(closed);
    } catch (e) {
      Alert.alert('Error', 'Failed to load today\'s records.');
    }
  };

  const sortClosedBy = (field) => {
    // toggle direction if same field, else default to ascending
    const asc = closedSortField === field ? !closedSortAsc : true;
    const copy = [...todayClosedRecords].sort((a, b) => {
      const aVal = field === 'start' ? (a.startTime || a.timestamp) : (a.endTime || a.timestamp);
      const bVal = field === 'start' ? (b.startTime || b.timestamp) : (b.endTime || b.timestamp);
      const aTime = aVal ? new Date(aVal).getTime() : 0;
      const bTime = bVal ? new Date(bVal).getTime() : 0;
      return asc ? aTime - bTime : bTime - aTime;
    });
    setTodayClosedRecords(copy);
    setClosedSortField(field);
    setClosedSortAsc(asc);
  };

  // try to start a phone call on mobile; on web attempt to open tel: URL or notify the user
  const handleCall = (rawNumber) => {
    if (!rawNumber) return;
    const number = ('' + rawNumber).trim();
    const telUrl = `tel:${number.replace(/[^+0-9]/g, '')}`; // strip non-numeric except +
    if (Platform.OS === 'web') {
      try {
        window.open(telUrl);
      } catch (e) {
        Alert.alert('Call', `Use your phone to call ${number}`);
      }
    } else {
      Linking.openURL(telUrl).catch(() => {
        Alert.alert('Error', 'Unable to start call.');
      });
    }
  };

  const loadUsers = async () => {
    // toggle: if currently shown, hide; otherwise load and show
    if (showUsers) {
      setShowUsers(false);
      setUsersList([]);
      return;
    }
    if (!adminLoggedIn) return Alert.alert('Admin', 'Please login as admin to run this.');
    try {
      const raw = await AsyncStorage.getItem(PROFILES_KEY);
      let parsed = raw ? JSON.parse(raw) : [];
      // sort by email
      parsed = parsed.sort((a, b) => ('' + (a.email || '')).localeCompare('' + (b.email || '')));
      setUsersList(parsed);
      setShowUsers(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to load users.');
    }
  };

  const revokeAdmin = async (targetEmail) => {
    if (!adminLoggedIn) return Alert.alert('Admin', 'Only admins can revoke admin role.');
    try {
      const raw = await AsyncStorage.getItem(PROFILES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((u) => (u.email || '').trim().toLowerCase() === (targetEmail || '').trim().toLowerCase());
      if (idx === -1) return Alert.alert('Not found', 'User not found.');
      list[idx].isAdmin = false;
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(list));
      // update activeProfile if it's the same user
      const active = await AsyncStorage.getItem('activeProfile');
      if (active) {
        const p = JSON.parse(active);
        if ((p.email || '').trim().toLowerCase() === (targetEmail || '').trim().toLowerCase()) {
          await AsyncStorage.setItem('activeProfile', JSON.stringify(list[idx]));
          setAdminLoggedIn(false);
        }
      }
      await recordAudit(`revoke_admin_${targetEmail}`);
      // refresh users list in UI
      setUsersList(list.sort((a, b) => ('' + (a.email || '')).localeCompare('' + (b.email || ''))));
      Alert.alert('Revoked', `${targetEmail} is no longer an admin on this device.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to revoke admin.');
    }
  };

  const makeAdmin = async (targetEmail) => {
    if (!adminLoggedIn) return Alert.alert('Admin', 'Only admins can grant admin role.');
    try {
      const raw = await AsyncStorage.getItem(PROFILES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((u) => (u.email || '').trim().toLowerCase() === (targetEmail || '').trim().toLowerCase());
      if (idx === -1) return Alert.alert('Not found', 'User not found.');
      list[idx].isAdmin = true;
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(list));
      const active = await AsyncStorage.getItem('activeProfile');
      if (active) {
        const p = JSON.parse(active);
        if ((p.email || '').trim().toLowerCase() === (targetEmail || '').trim().toLowerCase()) {
          await AsyncStorage.setItem('activeProfile', JSON.stringify(list[idx]));
          setAdminLoggedIn(true);
        }
      }
      await recordAudit(`grant_admin_${targetEmail}`);
      setUsersList(list.sort((a, b) => ('' + (a.email || '')).localeCompare('' + (b.email || ''))));
      Alert.alert('Granted', `${targetEmail} is now an admin on this device.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to grant admin.');
    }
  };

  const editUser = async (user) => {
    try {
      await AsyncStorage.setItem('activeProfile', JSON.stringify(user));
  // Profile tab is registered as 'MyProfile' inside the MainTabs navigator.
  // Navigate into the nested Main navigator and select the MyProfile tab.
  navigation.navigate('Main', { screen: 'MyProfile' });
    } catch (e) {
      Alert.alert('Error', 'Failed to open profile for edit.');
    }
  };

  const deleteUser = async (targetEmail) => {
    if (!adminLoggedIn) return Alert.alert('Admin', 'Only admins can delete users.');
    try {
      const raw = await AsyncStorage.getItem(PROFILES_KEY);
      let list = raw ? JSON.parse(raw) : [];
      const normalized = (targetEmail || '').trim().toLowerCase();
      const idx = list.findIndex((u) => (u.email || '').trim().toLowerCase() === normalized);
      if (idx === -1) return Alert.alert('Not found', 'User not found.');
      // remove profile
      list.splice(idx, 1);
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(list));
      // if the deleted user was active, clear activeProfile
      const active = await AsyncStorage.getItem('activeProfile');
      if (active) {
        const p = JSON.parse(active);
        if ((p.email || '').trim().toLowerCase() === normalized) {
          await AsyncStorage.removeItem('activeProfile');
        }
      }
      // remove hide flag for that user (best-effort)
      await AsyncStorage.removeItem(`${HIDE_KEY}_${targetEmail}`);
      await recordAudit(`delete_user_${targetEmail}`);
      setUsersList(list.sort((a, b) => ('' + (a.email || '')).localeCompare('' + (b.email || ''))));
      Alert.alert('Deleted', `${targetEmail} removed from local profiles.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to delete user.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
  <Text style={styles.title}>Admin Panel</Text>
  {activeProfileEmail && <Text style={{ textAlign: 'center', marginBottom: 8 }}>Active user: {activeProfileEmail}</Text>}

      

      {(!adminLoggedIn) ? (
        <View>
          <Text style={styles.label}>Admin access restricted</Text>
          <Text style={{ marginBottom: 8 }}>Only accounts with admin role can perform admin actions on this device.</Text>
        </View>
      ) : (
        <View>
          {/* migrate legacy removed */}

          {/* view all records removed */}

          {/* Removed standalone clear-records input/button - moved into per-user actions */}

          <View style={{ marginTop: 18 }}>
            <Text style={styles.label}>Search stored profiles (email or name)</Text>
            <TextInput style={styles.input} value={grantEmail} onChangeText={setGrantEmail} autoCapitalize="none" placeholder="email or name" />
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1, marginRight: 8 }]} onPress={() => { searchUser(); }}>
                <Text style={styles.primaryText}>Search for User</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryButton, { flex: 0.6 }]} onPress={() => { clearSearch(); }}>
                <Text style={styles.secondaryText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Show all users (admin only) */}
          <TouchableOpacity style={[styles.primaryButton,{marginTop:12}, activeButtons['users'] && styles.toggledRed]} onPress={() => { toggleActive('users'); loadUsers(); }}>
            <Text style={styles.primaryText}>{showUsers ? 'Hide users' : 'Show all users'}</Text>
          </TouchableOpacity>

          {/* View audit log (admin only) */}
          <TouchableOpacity style={[styles.primaryButton,{marginTop:12}, activeButtons['audit'] && styles.toggledRed]} onPress={() => { toggleActive('audit'); loadAudit(); }}>
            <Text style={styles.primaryText}>{showAudit ? 'Hide admin audit log' : 'View admin audit log'}</Text>
          </TouchableOpacity>

          {/* View unfit audit (admin only) */}
          <TouchableOpacity style={[styles.primaryButton,{marginTop:12}, activeButtons['unfit'] && styles.toggledRed]} onPress={() => { navigation.navigate('AdminUnfitLog'); }}>
            <Text style={styles.primaryText}>View unfit to train log</Text>
          </TouchableOpacity>

          {/* Today's records (open/closed) */}
            <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 12 }, activeButtons['openToday'] && styles.toggledRed]}
            onPress={async () => {
              toggleActive('openToday');
              // toggle visibility: hide if already shown, otherwise load and show
              if (showOpenToday) {
                setShowOpenToday(false);
              } else {
                await loadTodayRecords();
                setShowOpenToday(true);
                setShowClosedToday(false);
              }
            }}
          >
            <Text style={styles.primaryText}>{showOpenToday ? "Hide today's open trainings" : "Show today's open trainings"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.primaryButton,{marginTop:12}, activeButtons['closedToday'] && styles.toggledRed]} onPress={async () => {
            // toggle closed view; ensure records loaded then set visibility deterministically
            toggleActive('closedToday');
            if (showClosedToday) {
              setShowClosedToday(false);
            } else {
              if (!todayClosedRecords.length) {
                await loadTodayRecords();
              }
              setShowClosedToday(true);
              setShowOpenToday(false);
            }
          }}>
            <Text style={styles.primaryText}>{showClosedToday ? "Hide today's closed trainings" : "Show today's closed trainings"}</Text>
          </TouchableOpacity>

          {/* Logout moved to ProfileScreen; removed duplicate button here */}
          {showUsers && usersList.length > 0 && (
            <View style={{ marginTop: 18, maxHeight: 360 }}>
              <Text style={styles.sectionTitle}>Registered users</Text>
              <ScrollView
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 10 }}
                style={{ paddingRight: 6 }}
              >
                {usersList.map((u, i) => (
                  <View key={i} style={styles.recordCard}>
                    <View style={styles.statsRow}>
                      <View style={styles.statCol}>
                        <Text style={styles.recordText}><Text style={styles.bold}>Type:</Text>{' '}{u.isAdmin ? 'Admin' : 'Normal'}</Text>
                      </View>
                      <View style={styles.statCol}>
                        <Text style={styles.recordText}><Text style={styles.bold}>Unit:</Text>{' '}{u.subUnit || u.sub_unit || u.subunit || u.unit || u.unitName || ''}</Text>
                      </View>
                      <View style={[styles.statCol, styles.nameCol]}>
                        <Text style={styles.recordText}><Text style={styles.bold}>Rank/Name:</Text>{' '}{(u.rank || '') + (u.rank ? ' ' : '') + (u.fullName || u.name || '')}</Text>
                      </View>
                    </View>
                    <View style={styles.actionRow}>
                      <View style={styles.actionBtnWrap}>
                        <TouchableOpacity style={[styles.secondaryButton, styles.smallButtonFull]} onPress={() => editUser(u)}>
                          <Text style={[styles.secondaryText, styles.smallButtonText]}>Edit</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.actionBtnWrap}>
                        {u.isAdmin ? (
                          <TouchableOpacity style={[styles.dangerButton, styles.smallButtonFull]} onPress={() => {
                            confirmAction('Confirm', `Revoke admin from ${u.email}?`, () => revokeAdmin(u.email), 'Revoke');
                          }}>
                            <Text style={[styles.dangerText, styles.smallButtonText]}>Revoke admin</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity style={[styles.primaryButton, styles.smallButtonFull]} onPress={() => {
                            confirmAction('Confirm', `Grant admin to ${u.email}?`, () => makeAdmin(u.email), 'OK');
                          }}>
                            <Text style={[styles.primaryText, styles.smallButtonText]}>Make admin</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.actionBtnWrap}>
                        <TouchableOpacity style={[styles.dangerButton, styles.smallButtonFull]} onPress={() => {
                          confirmAction('Confirm', `Delete user ${u.email}?`, () => deleteUser(u.email), 'Delete');
                        }}>
                          <Text style={[styles.dangerText, styles.smallButtonText]}>Delete</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.actionBtnWrap}>
                        <TouchableOpacity style={[styles.dangerButton, styles.smallButtonFull, { backgroundColor: '#b33' }]} onPress={() => {
                          confirmAction('Confirm', `Delete all records for ${u.email}?`, () => clearUserRecords(u.email), 'Delete');
                        }}>
                          <Text style={[styles.dangerText, styles.smallButtonText]}>Delete records</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

  {/* CSV export removed */}

      {showAudit && (
        <View style={{ marginTop: 18 }}>
          <Text style={styles.sectionTitle}>Audit Log</Text>
          {auditLog.length === 0 ? (
            <Text style={{ marginBottom: 8 }}>No audit entries found.</Text>
          ) : (
            auditLog.map((a, i) => (
              <View key={i} style={styles.recordCard}>
                <Text style={styles.recordText}><Text style={styles.bold}>{a.action}</Text> by {a.adminEmail}</Text>
                <Text style={styles.recordText}>{new Date(a.timestamp).toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {showOpenToday && (
        <View style={{ marginTop: 18 }}>
          <Text style={styles.sectionTitle}>Today's Open Trainings (00:00 - 23:59)</Text>
          {todayOpenRecords.length === 0 && <Text style={{ marginBottom: 8 }}>No open trainings found for today.</Text>}
          {todayOpenRecords.map((r, i) => (
            <View key={i} style={styles.recordCard}>
              <View style={styles.statsRow}>
                <View style={[styles.statCol, styles.nameCol]}>
                  <Text style={styles.recordText}><Text style={styles.bold}>R/Name:</Text>{' '}{(r.ownerRank || '') + (r.ownerRank ? ' ' : '') + (r.ownerName || '')}</Text>
                </View>
                <View style={styles.statCol}>
                  <TouchableOpacity onPress={() => handleCall(r.ownerContact)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.phoneIcon}>📞</Text>
                      <Text style={[styles.recordText, styles.link]}>{r.ownerContact || ''}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={styles.statCol} />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.recordText}><Text style={styles.bold}>Parent Unit:</Text>{' '}{r.ownerParentUnit || ''}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.recordText}><Text style={styles.bold}>Sub Unit:</Text>{' '}{r.ownerSubUnit || ''}</Text>
                </View>
                <View style={styles.statCol} />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.recordText}><Text style={styles.bold}>Date:</Text>{' '}{r.startTime ? new Date(r.startTime).toLocaleDateString() : (r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '')}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.recordText}><Text style={styles.bold}>Start:</Text>{' '}{r.startTime ? new Date(r.startTime).toLocaleTimeString() : ''}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.recordText}><Text style={styles.bold}>End:</Text>{' '}{r.endTime ? new Date(r.endTime).toLocaleTimeString() : ''}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {showClosedToday && (
        <View style={{ marginTop: 18 }}>
          <Text style={styles.sectionTitle}>Today's Closed Trainings (00:00 - 23:59)</Text>
          {/* Sort controls for closed trainings */}
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <TouchableOpacity style={[styles.secondaryButton, { marginRight: 8 }]} onPress={() => sortClosedBy('start')}>
              <Text style={styles.secondaryText}>Sort by Start {closedSortField === 'start' ? (closedSortAsc ? '↑' : '↓') : ''}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryButton]} onPress={() => sortClosedBy('end')}>
              <Text style={styles.secondaryText}>Sort by End {closedSortField === 'end' ? (closedSortAsc ? '↑' : '↓') : ''}</Text>
            </TouchableOpacity>
          </View>
          {todayClosedRecords.length === 0 && <Text style={{ marginBottom: 8 }}>No closed trainings found for today.</Text>}
          {todayClosedRecords.map((r, i) => (
            <View key={i} style={styles.recordCard}>
              <View style={styles.statsRow}>
                <View style={[styles.statCol, styles.nameCol]}>
                  <Text style={styles.recordText}><Text style={styles.bold}>R/Name:</Text>{' '}{(r.ownerRank || '') + (r.ownerRank ? ' ' : '') + (r.ownerName || '')}</Text>
                </View>
                <View style={styles.statCol}>
                  <TouchableOpacity onPress={() => handleCall(r.ownerContact)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.phoneIcon}>📞</Text>
                      <Text style={[styles.recordText, styles.link]}>{r.ownerContact || ''}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.recordText}><Text style={styles.bold}>Parent Unit:</Text>{' '}{r.ownerParentUnit || ''}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.recordText}><Text style={styles.bold}>Sub-Unit:</Text>{' '}{r.ownerSubUnit || ''}</Text>
                </View>
                <View style={styles.statCol} />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.recordText}><Text style={styles.bold}>Date:</Text>{' '}{r.startTime ? new Date(r.startTime).toLocaleDateString() : (r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '')}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.recordText}><Text style={styles.bold}>Start:</Text>{' '}{r.startTime ? new Date(r.startTime).toLocaleTimeString() : ''}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.recordText}><Text style={styles.bold}>End:</Text>{' '}{r.endTime ? new Date(r.endTime).toLocaleTimeString() : ''}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#eaf6ff', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  primaryButton: { backgroundColor: '#1f6feb', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  primaryText: { color: '#fff', fontWeight: '700' },
  toggledRed: { backgroundColor: '#d9534f' },
  secondaryButton: { backgroundColor: '#eee', padding: 10, borderRadius: 8, alignItems: 'center' },
  secondaryText: { color: '#333' },
  label: { marginBottom: 6, marginTop: 6 },
  input: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  dangerButton: { backgroundColor: '#d9534f', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  dangerText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  recordCard: { backgroundColor: '#fff', padding: 6, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: '#ddd' },
  recordText: { fontSize: 14 },
  disabledEmail: { color: '#666' },
  actionRow: { flexDirection: 'row', marginTop: 6, flexWrap: 'wrap', alignItems: 'flex-start' },
  bold: { fontWeight: '700' },
  actionBtnWrap: { flex: 1, paddingHorizontal: 4 },
  smallButtonFull: { width: '100%', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 6, alignItems: 'center', marginTop: 0, marginBottom: 0, marginVertical: 0, alignSelf: 'stretch' },
  link: { color: '#1f6feb', textDecorationLine: 'underline' },
  phoneIcon: { marginRight: 6, fontSize: 16 },
  statsRow: { flexDirection: 'row', marginTop: 6 },
  statCol: { flex: 1, paddingRight: 8 },
  nameCol: { flex: 4 },
  smallButton: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, minWidth: 64 },
  smallButtonText: { fontSize: 12, fontWeight: '700' },
});

export default AdminScreen;