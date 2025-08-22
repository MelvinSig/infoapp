import { Text, View } from 'react-native';
import { createStaticNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import EventsStack from './screens/EventsScreen';
import ContactScreen from './screens/ContactScreen';
import FontAwesome from "@expo/vector-icons/FontAwesome";

// Navigator -----------------------------------------------
const Tabs = createBottomTabNavigator({
  screens: {
    Home: HomeScreen,
    Events: { 
      screen: EventsStack, 
      options: { headerShown: false }
    },
    Contact: ContactScreen
  },
  
  screenOptions: ({ route }) => ({
    tabBarActiveTintColor: "green",
    tabBarInactiveTintColor: "gray",
    tabBarIcon: ({ focused, color, size }) => {
      let iconName;

      if (route.name === "Home") {
        iconName = "home";
      } else if (route.name === "Events") {
        iconName = focused ? "calendar" : "calendar-o";
      } else if (route.name === "Contact") {
        iconName = focused ? "address-book" : "address-book-o";
      } else {
        iconName = "question-circle";s

      }
      

      return <FontAwesome name={iconName} size={size} color={color} />;
    }
  })
});

// Root navigation component -------------------------------
const Navigation = createStaticNavigation(Tabs);

export default function App() {
  return <Navigation />;
}