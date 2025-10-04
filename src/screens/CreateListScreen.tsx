import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ListsStackParamList } from '../navigation/types';
import { colors, typography, spacing, borderRadius } from '../utils/constants';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useShoppingList } from '../hooks/useShoppingList';

type Props = NativeStackScreenProps<ListsStackParamList, 'CreateListScreen'>;

export const CreateListScreen: React.FC<Props> = ({ navigation }) => {
  const [listName, setListName] = useState('');
  const { addList } = useShoppingList();

  const createList = async () => {
    if (listName.trim()) {
      await addList(listName.trim());
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="list" size={32} color={colors.primary} />
          </View>
          
          <Text style={styles.description}>
            Create a new shopping list to organize your items
          </Text>
          
          <View style={styles.formContainer}>
            <Input
              label="List Name"
              placeholder="Enter list name..."
              value={listName}
              onChangeText={setListName}
              autoFocus
              style={styles.input}
            />
            
            <Button
              title="Create List"
              onPress={createList}
              disabled={!listName.trim()}
              style={styles.createButton}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    backgroundColor: colors.primary + '15',
    borderRadius: 50,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
    gap: spacing.lg,
  },
  input: {
    marginBottom: 0,
  },
  createButton: {
    marginTop: spacing.sm,
  },
});