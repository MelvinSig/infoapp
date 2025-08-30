import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, Button, List, IconButton } from 'react-native-paper';

const NoticeItem = ({ icon, title, subtitle, onPress }) => (
  <List.Item
    title={title}
    description={subtitle}
    onPress={onPress}
    left={() => <List.Icon icon={icon} />}
    right={() => <IconButton icon="chevron-right" />}
  />
);

const HomeScreen = ({ navigation }) => {
  const importantNotices = [
    {
      icon: 'alert-circle',
      title: 'Health Declaration Required',
      subtitle: 'Complete your health declaration before attending SFT.',
      onPress: () => navigation && navigation.navigate('HealthHome'),
    },
    {
      icon: 'calendar-check',
      title: 'Upcoming Training',
      subtitle: 'Open trainings this week — check your SFT schedule.',
      onPress: () => navigation && navigation.navigate('Sft'),
    },
    {
      icon: 'information',
      title: 'Site Notice',
      subtitle: 'Platform maintenance on Sunday 02:00 - 04:00.',
      onPress: () => {},
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 12 }}>
      <Card style={styles.heroCard}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.heroTitle}>
            Welcome
          </Text>
          <Text variant="bodyMedium" style={styles.heroSubtitle}>
            Quick access to your trainings, health declaration, and notices.
          </Text>
          <View style={styles.heroActions}>
            <Button mode="contained" onPress={() => navigation && navigation.navigate('Sft')}>
              My SFT
            </Button>
            <Button mode="outlined" onPress={() => navigation && navigation.navigate('Profile')} style={styles.actionSpacer}>
              Profile
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Important Notices" subtitle="Tap an item to act" />
        <Card.Content>
          {importantNotices.map((n, i) => (
            <NoticeItem
              key={i}
              icon={n.icon}
              title={n.title}
              subtitle={n.subtitle}
              onPress={n.onPress}
            />
          ))}
        </Card.Content>
      </Card>

      <Card style={[styles.card, styles.smallCard]}>
        <Card.Title title="Quick Links" />
        <Card.Content>
          <View style={styles.linksRow}>
            <Button icon="file-export" onPress={() => navigation && navigation.navigate('Sft_recordsScreen')}>Records</Button>
            <Button icon="account-group" onPress={() => navigation && navigation.navigate('Admin')} style={styles.actionSpacer}>Admin</Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f8' },
  heroCard: { marginBottom: 12, marginHorizontal: 4, paddingVertical: 4, elevation: 2 },
  heroTitle: { marginBottom: 6 },
  heroSubtitle: { marginBottom: 12, color: '#333' },
  heroActions: { flexDirection: 'row', alignItems: 'center' },
  actionSpacer: { marginLeft: 12 },
  card: { marginBottom: 12, marginHorizontal: 4 },
  smallCard: { marginHorizontal: 4 },
  linksRow: { flexDirection: 'row' },
});

export default HomeScreen;