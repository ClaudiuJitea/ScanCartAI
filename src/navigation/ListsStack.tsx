import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ListsStackParamList } from './types';
import { colors, spacing, borderRadius } from '../utils/constants';
import { ListsScreen } from '../screens/ListsScreen';
import { CreateListScreen } from '../screens/CreateListScreen';
import { HomeScreen } from '../screens/HomeScreen';

const Stack = createNativeStackNavigator<ListsStackParamList>();

export const ListsStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="ListsScreen" 
        component={ListsScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="CreateListScreen" 
        component={CreateListScreen}
        options={({ navigation }) => ({ 
          title: 'Create New List',
          presentation: 'modal',
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="HomeScreen" 
        component={HomeScreen}
        options={{ 
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    marginRight: spacing.md,
  },
});