import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  'Do you have underlying medical conditions that require medical aid for you to train safely? For example, Asthmatic personnel.',
];

const STORAGE_KEY_BASE = 'healthData';
const UNFIT_LOG_KEY = 'HEALTH_UNFIT_LOG';

const HealthScreen = () => {
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null));
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const progress = useMemo(() => {
    const answered = answers.filter((a) => a !== null).length;
    return Math.round((answered / QUESTIONS.length) * 100);
  }, [answers]);

  const setAnswer = (i, val) => {
    const copy = [...answers];
    copy[i] = val;
    setAnswers(copy);
  };

  const handleSubmit = async () => {
    if (answers.includes(null)) {
      const msg = 'Please answer all questions before submitting.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Incomplete', msg);
      }
      setStatusMessage('Please complete all questions');
      setTimeout(() => setStatusMessage(''), 2500);
      return;
    }
    // get current user (if any) so we can save per-user unfit records
    const activeRaw = await AsyncStorage.getItem('activeProfile');
    const storedProfile = activeRaw ? JSON.parse(activeRaw) : null;
    const currentEmail = storedProfile ? (storedProfile.email || null) : null;
    const norm = currentEmail ? ('' + currentEmail).trim().toLowerCase() : null;
    const key = norm ? `${STORAGE_KEY_BASE}_${norm}` : STORAGE_KEY_BASE;
    const unfitKey = norm ? `${STORAGE_KEY_BASE}_${norm}_unfit` : `${STORAGE_KEY_BASE}_unfit`;

    // Health criteria required for being fit to train today
    const requiredAnswers = ['No','No','No','No','No','No','No','Yes','No','No','Yes','No','No'];
    const failedIndices = [];
    for (let i = 0; i < requiredAnswers.length; i++) {
      if (answers[i] !== requiredAnswers[i]) failedIndices.push(i);
    }
    const meetsCriteria = failedIndices.length === 0;
    if (!meetsCriteria) {
      // prepare messages and save an unfit record for audit
      const failedList = failedIndices.map((i) => (i + 1)).join(', ');
      const failedPreview = failedIndices.slice(0, 3).map(i => `${i + 1}. ${QUESTIONS[i]}`).join('\n');
      const msg = `Based on your answers you are currently unfit to train today.\nFailed checks: ${failedList}.\nPlease train another day when you are fit.`;
      setStatusMessage('Unfit to train');
      try {
        const payload = { timestamp: new Date().toISOString(), answers, isFit: false, email: currentEmail || null, failedIndices };
        // append to per-user unfit list
        const existing = await AsyncStorage.getItem(unfitKey);
        const parsed = existing ? JSON.parse(existing) : [];
        parsed.unshift(payload);
        await AsyncStorage.setItem(unfitKey, JSON.stringify(parsed));
        // append to global unfit audit log (most recent first)
        const logRaw = await AsyncStorage.getItem(UNFIT_LOG_KEY);
        const log = logRaw ? JSON.parse(logRaw) : [];
        log.unshift({ timestamp: payload.timestamp, email: currentEmail || 'unknown', failedIndices, preview: failedPreview });
        await AsyncStorage.setItem(UNFIT_LOG_KEY, JSON.stringify(log));
      } catch (e) {
        console.log('Failed to save unfit record', e);
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg + '\n\n' + (failedPreview ? `Details:\n${failedPreview}` : ''));
      } else {
        Alert.alert('Unfit to train', msg + (failedPreview ? '\n\nSee details in history.' : ''));
      }

      // do not save a "fit" declaration
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }

    setSaving(true);
    setStatusMessage('Saving...');
    try {
      console.log('Health submit started');
      // attach to current user's email when available so each user has their own declaration
      const activeRaw = await AsyncStorage.getItem('activeProfile');
      const storedProfile = activeRaw ? JSON.parse(activeRaw) : null;
      const currentEmail = storedProfile ? (storedProfile.email || null) : null;
      const norm = currentEmail ? ('' + currentEmail).trim().toLowerCase() : null;
      const key = norm ? `${STORAGE_KEY_BASE}_${norm}` : STORAGE_KEY_BASE;
      const payload = { timestamp: new Date().toISOString(), answers };
      await AsyncStorage.setItem(key, JSON.stringify(payload));
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Saved: Your health declaration was saved.');
      } else {
        Alert.alert('Saved', 'Your health declaration was saved.');
      }
      setStatusMessage('Saved');
    } catch (e) {
      const msg = 'Failed to save data.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Error: ' + msg);
      } else {
        Alert.alert('Error', msg);
      }
      console.log('save error', e);
      setStatusMessage('Save failed');
    } finally {
      setSaving(false);
      // clear the message after a short delay so UI doesn't stay sticky
      setTimeout(() => setStatusMessage(''), 2500);
    }
  };

  const reset = () => {
    setAnswers(Array(QUESTIONS.length).fill(null));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Health Declaration</Text>
        <Text style={styles.headerSubtitle}>Please complete the short health check before attending events.</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{progress}%</Text>
        </View>
      </View>

      <View style={styles.formArea}>
        {QUESTIONS.map((q, i) => (
          <View key={i} style={styles.questionBlock}>
            <Text style={styles.qIndex}>{i + 1}.</Text>
            <View style={styles.qContent}>
              <Text style={styles.qText}>{q}</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity
                  onPress={() => setAnswer(i, 'Yes')}
                  style={[
                    styles.pill,
                    answers[i] === 'Yes' ? styles.pillYesActive : styles.pillDefault,
                  ]}
                >
                  <Text style={[styles.pillText, answers[i] === 'Yes' && styles.pillTextActive]}>Yes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setAnswer(i, 'No')}
                  style={[
                    styles.pill,
                    answers[i] === 'No' ? styles.pillNoActive : styles.pillDefault,
                  ]}
                >
                  <Text style={[styles.pillText, answers[i] === 'No' && styles.pillTextActive]}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction, saving && styles.actionDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionText}>Submit</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]} onPress={reset} disabled={saving}>
            <Text style={[styles.actionText, styles.secondaryActionText]}>Reset</Text>
          </TouchableOpacity>
        </View>

  {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}

  <Text style={styles.note}>By submitting you confirm that your answers are accurate to the best of your knowledge.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f4f7fb',
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0b3d91',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#556676',
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#e6eefc',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1f6feb',
  },
  progressLabel: {
    minWidth: 40,
    textAlign: 'right',
    color: '#0b3d91',
    fontWeight: '700',
  },

  formArea: {
    // main card area for questions
  },
  questionBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  qIndex: {
    width: 28,
    color: '#556676',
    fontWeight: '700',
    textAlign: 'center',
    marginRight: 8,
  },
  qContent: {
    flex: 1,
  },
  qText: {
    fontSize: 15,
    color: '#233646',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 90,
    alignItems: 'center',
  },
  pillDefault: {
    backgroundColor: '#f5f7fb',
    borderColor: '#e1eaf8',
  },
  pillYesActive: {
    backgroundColor: '#e6f4ea',
    borderColor: '#34a853',
  },
  pillNoActive: {
    backgroundColor: '#fdecea',
    borderColor: '#db3b2d',
  },
  pillText: {
    fontWeight: '700',
    color: '#233646',
    fontSize: 15,
  },
  pillTextActive: {
    color: '#0b3d91',
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: '#1f6feb',
    marginRight: 10,
  },
  actionDisabled: {
    opacity: 0.7,
  },
  secondaryAction: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe7fb',
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryActionText: {
    color: '#0b3d91',
  },
  note: {
    marginTop: 12,
    fontSize: 12,
    color: '#6b7a86',
    textAlign: 'center',
  },
  status: {
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '700',
    color: '#0b3d91',
  },
});

export default HealthScreen;
