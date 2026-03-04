import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import ErrorPopup from './src/components/ErrorPopup';
import { setErrorHandler } from './src/utils/errorHandler';

import HomeScreen from './src/screens/HomeScreen';
import BillsListScreen from './src/screens/BillsListScreen';
import CreateBillScreen from './src/screens/CreateBillScreen';
import BillDetailScreen from './src/screens/BillDetailScreen';

const NAVY = '#1B2A4A';
const GOLD = '#C5A55A';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }) {
  const icons = { Home: '🏠', Bills: '📋' };
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || '📄'}
    </Text>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Bills" component={BillsListScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [errorMessage, setErrorMessage] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);

  const handleError = useCallback((msg) => {
    setErrorMessage(msg || 'Something went wrong');
    setErrorVisible(true);
  }, []);

  React.useEffect(() => {
    setErrorHandler(handleError);
  }, [handleError]);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: NAVY },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={HomeTabs}
          options={{ title: 'Royal Wedding Collection', headerTitleStyle: { color: GOLD, fontWeight: '800' } }}
        />
        <Stack.Screen name="CreateBill" component={CreateBillScreen} options={{ title: 'New Bill' }} />
        <Stack.Screen name="BillDetail" component={BillDetailScreen} options={{ title: 'Bill Details' }} />
        <Stack.Screen name="BillsTab" component={BillsListScreen} options={{ title: 'All Bills' }} />
      </Stack.Navigator>
      <ErrorPopup
        visible={errorVisible}
        message={errorMessage}
        onClose={() => setErrorVisible(false)}
      />
    </NavigationContainer>
  );
}
