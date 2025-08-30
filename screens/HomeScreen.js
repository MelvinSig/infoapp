import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";
import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';

const HomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>


        <Card.Cover
          source={{
            uri: "https://fitolit.com/wp-content/uploads/2025/02/runningvsgym.webp"
          }}
          style={styles.coverImage}
        />
      </Card>

        <Card.Content>
          <Text variant="headlineMedium" style={{ textAlign: "center" }}>Self-Regulated Fitness Training</Text>
        </Card.Content>
        
      <Card style={[styles.card, styles.elevatedCard]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.infoHeader}>Important Notices</Text>
          <Text variant="bodyMedium" style={styles.infoSub}>Please observe the safety regulations below.</Text>

          <View style={styles.list}>
            <View style={styles.itemRow}>
              <View style={styles.itemIconContainer}><FontAwesome name="calendar-times-o" size={20} color="#1f6feb" /></View>
              <View style={styles.itemTextWrap}>
                <Text style={styles.itemTitle}>Timing</Text>
                <Text style={styles.itemDesc}>0700 - 0900H, and 1700 - 1900H (Working days only)</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.itemRow}>
              <View style={styles.itemIconContainer}><FontAwesome5 name="route" size={20} color="#1f6feb" /></View>
              <View style={styles.itemTextWrap}>
                <Text style={styles.itemTitle}>Route</Text>
                <Text style={styles.itemDesc}>Approved routes only</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.itemRow}>
              <View style={styles.itemIconContainer}><Ionicons name="people" size={20} color="#1f6feb" /></View>
              <View style={styles.itemTextWrap}>
                <Text style={styles.itemTitle}>Level</Text>
                <Text style={styles.itemDesc}>Buddy level for run and gym</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.itemRow}>
              <View style={styles.itemIconContainer}><FontAwesome name="mobile" size={20} color="#1f6feb" /></View>
              <View style={styles.itemTextWrap}>
                <Text style={styles.itemTitle}>Contact</Text>
                <Text style={styles.itemDesc}>Mobile phone. NO earpiece/headphones allowed.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.itemRow}>
              <View style={styles.itemIconContainer}><FontAwesome5 name="swimmer" size={20} color="#1f6feb" /></View>
              <View style={styles.itemTextWrap}>
                <Text style={styles.itemTitle}>Swimming</Text>
                <Text style={styles.itemDesc}>0730 - 1700H (With lifeguard on duty only)</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
 
      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  // soft sky-blue background to match the hero image
  backgroundColor: "#eaf6ff"
  },
  coverImage: {
  height: 220,
  marginVertical: 12,
  borderRadius: 8
  },
  card: {
  marginBottom: 16,
  backgroundColor: 'transparent'
  },
  elevatedCard: {
  elevation: 4,
  backgroundColor: "#ffffff",
  borderRadius: 10,
  paddingVertical: 8
  },
  infoHeader: { fontWeight: '700', color: '#0b3d91', marginBottom: 6, textAlign: 'left' },
  infoSub: { color: '#556676', marginBottom: 12 },
  list: { marginTop: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  itemIconContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#e6f0ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemTextWrap: { flex: 1 },
  itemTitle: { fontWeight: '700', color: '#233646' },
  itemDesc: { color: '#556676', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f0f4fb', marginVertical: 4 },
  outlinedCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "white"
  },
  flatCard: {
    elevation: 0,
    backgroundColor: "white"
  },
  interactiveCard: {
    elevation: 2,
    backgroundColor: "white"
  }
});

export default HomeScreen;