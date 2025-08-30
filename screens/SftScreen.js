import React, { useLayoutEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { createStackNavigator } from "@react-navigation/stack";
import HealthScreen from "./HealthScreen";
import Sft_statusScreen from "./Sft_statusScreen"; 
import Sft_recordsScreen from "./Sft_recordsScreen";

const SftScreen = ({navigation}) => (
  <View style={styles.container}>
    <Pressable onPress={() => navigation.navigate("HealthHome")}> 
      <View style={styles.primaryButton}>
        <View style={styles.rowInline}>
          <MaterialIcons name="health-and-safety" size={24} color="#fff" />
          <Text style={[styles.primaryText, { marginLeft: 10 }]}>My Health Declaration</Text>
        </View>
      </View>
    </Pressable>

    <Pressable onPress={() => navigation.navigate("SftstatusHome")}>
      <View style={styles.successButton}>
        <View style={styles.rowInline}>
          <FontAwesome5 name="running" size={24} color="white" />
          <Text style={[styles.primaryText, { marginLeft: 10 }]}>My SFT Status</Text>
        </View>
      </View>
    </Pressable>

    <Pressable onPress={() => navigation.navigate("SftrecordsHome") }>
      <View style={styles.warnButton}>
        <View style={styles.rowInline}>
          <FontAwesome name="database" size={24} color="#fff" />
          <Text style={[styles.primaryText, { marginLeft: 10 }]}>My SFT Records</Text>
        </View>
      </View>
    </Pressable>

  </View>
);

const Stack = createStackNavigator();

const SftStack = ({ navigation }) => {
  // hide the parent navigator's header so we don't get two stacked headers
  useLayoutEffect(() => {
    if (navigation && navigation.setOptions) {
      navigation.setOptions({ headerShown: false });
    }
  }, [navigation]);

  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="SftHome" component={SftScreen} options={{ title: 'MySFT' }} />
      <Stack.Screen name="HealthHome" component={HealthScreen} />
      <Stack.Screen name="SftstatusHome" component={Sft_statusScreen} />
      <Stack.Screen name="SftrecordsHome" component={Sft_recordsScreen} />
    </Stack.Navigator>
  );
};

export default SftStack;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eaf6ff',
    padding: 12,
  },
  primaryButton: {
    backgroundColor: '#1f6feb',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
  width: '90%',
  alignSelf: 'center',
  alignItems: 'center',
  // ensure consistent minimum size across small screens
  minWidth: 260,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  rowInline: { flexDirection: 'row', alignItems: 'center' },
  successButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center',
    minWidth: 260,
  },
  warnButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center',
    minWidth: 260,
  },
});