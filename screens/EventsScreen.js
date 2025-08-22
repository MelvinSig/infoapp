import { View, Text, Pressable } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import EventsSecondScreen from "./EventsSecondScreen";

const EventsScreen = ({navigation}) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Events!</Text>
    <Pressable
      onPress={() => navigation.navigate("EventsSecond")}>
        //comment
        <View
          style={{
            borderWidth: 5,
            padding: 20,
            backgroundColor: 'lightblue',
            borderRadius: 5
          }}
        >
          <Text style={{ fontSize: 16, color: 'red', fontWeight: 'bold' }}>National Day Parade</Text>
        </View>
        
        <View
          style={{
            borderWidth: 5,
            padding: 20,
            backgroundColor: 'lightgreen',
            borderRadius: 5
          }}
        >
          <Text style={{ fontSize: 16, color: 'red', fontWeight: 'bold' }}>National Day Parade</Text>
        </View>

    </Pressable>
  </View>
);

const Stack = createStackNavigator();

const EventsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="EventsHome" component={EventsScreen} />
    <Stack.Screen name="EventsSecond" component={EventsSecondScreen} />
  </Stack.Navigator>
);

export default EventsStack;