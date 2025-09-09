import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from './types';
import { ListsStack } from './ListsStack';
import { HomeStack } from './HomeStack';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ListScannerScreen } from '../screens/ListScannerScreen';
import { MealPlannerScreen } from '../screens/MealPlannerScreen';
import { FloatingTabBar } from '../components/FloatingTabBar';

const Tab = createBottomTabNavigator<RootTabParamList>();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="MyLists" 
        component={ListsStack}
        options={{
          tabBarLabel: 'My Lists',
        }}
      />
      <Tab.Screen 
        name="MealPlanner" 
        component={MealPlannerScreen}
        options={{
          tabBarLabel: 'Meal Planner',
        }}
      />
      <Tab.Screen 
        name="ListScanner" 
        component={ListScannerScreen}
        options={{
          tabBarLabel: 'Scan',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};