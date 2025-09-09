import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../utils/constants';
interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export const FloatingTabBar: React.FC<TabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const getIconName = (routeName: string, focused: boolean) => {
    if (routeName === 'MyLists') {
      return focused ? 'list' : 'list-outline';
    } else if (routeName === 'MealPlanner') {
      return focused ? 'restaurant' : 'restaurant-outline';
    } else if (routeName === 'Settings') {
      return focused ? 'settings' : 'settings-outline';
    } else if (routeName === 'ListScanner') {
      return focused ? 'scan' : 'scan-outline';
    }
    return 'help';
  };


  return (
    <View style={[
      styles.container,
      { 
        bottom: Math.max(insets.bottom - 24, 0),
        paddingBottom: Math.max(insets.bottom, 2),
      }
    ]}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined 
          ? options.tabBarLabel 
          : options.title !== undefined 
          ? options.title 
          : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconName = getIconName(route.name, isFocused);

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.7}
            onPress={onPress}
            style={styles.tabItem}
          >
            <View style={[
              styles.iconContainer,
              { backgroundColor: isFocused ? colors.primary + '08' : 'transparent' }
            ]}>
              <Ionicons 
                name={iconName as keyof typeof Ionicons.glyphMap}
                size={22} 
                color={isFocused ? colors.primary : colors.textMuted} 
              />
            </View>
            <Text style={[
              styles.tabLabel,
              { color: isFocused ? colors.primary : colors.textMuted }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
    minHeight: 70,
    width: 350,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  tabLabel: {
    ...typography.muted,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});