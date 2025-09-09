import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { ListsStackParamList } from '../navigation/types';
import { colors, typography, spacing, borderRadius } from '../utils/constants';
import { useShoppingList } from '../hooks/useShoppingList';
import { NameInputModal } from '../components/common/NameInputModal';

type Props = NativeStackScreenProps<ListsStackParamList, 'ListsScreen'>;

export const ListsScreen: React.FC<Props> = ({ navigation }) => {
  const rootNavigation = useNavigation<any>();
  const [userName, setUserName] = useState<string>('User');
  const [editingList, setEditingList] = useState<{id: string, name: string} | null>(null);
  const { 
    lists, 
    currentListId, 
    loading, 
    initializeStore,
    setCurrentList,
    deleteList,
    updateListName
  } = useShoppingList();

  useEffect(() => {
    initializeStore();
    loadUserName();
  }, []);

  const loadUserName = async () => {
    try {
      const storedUserName = await SecureStore.getItemAsync('user_name');
      if (storedUserName) {
        setUserName(storedUserName);
      }
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  };

  const createNewList = () => {
    navigation.navigate('CreateListScreen');
  };

  const openShoppingList = async (listId: string) => {
    await setCurrentList(listId);
    // Navigate to the HomeScreen within this stack
    navigation.navigate('HomeScreen', { listId });
  };

  const handleEditList = (listId: string, currentName: string) => {
    setEditingList({ id: listId, name: currentName });
  };

  const handleUpdateListName = async (newName: string) => {
    if (editingList) {
      await updateListName(editingList.id, newName);
      setEditingList(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingList(null);
  };

  const renderListItem = ({ item }: { item: any }) => {
    const isCurrentList = item.id === currentListId;
    const itemCount = item.items.length;
    const completedCount = item.items.filter((i: any) => i.isCompleted).length;
    
    const getSubtitle = () => {
      if (itemCount === 0) return 'Empty list';
      return `${completedCount}/${itemCount} completed`;
    };

    return (
      <TouchableOpacity 
        style={[styles.listCard, isCurrentList && styles.currentListCard]}
        onPress={() => openShoppingList(item.id)}
      >
        <View style={styles.listHeader}>
          <View style={styles.listIcon}>
            <Ionicons 
              name={
                (item.isMealPlan ||
                 item.name.toLowerCase().includes('soup') ||
                 item.name.toLowerCase().includes('dish') ||
                 item.name.toLowerCase().includes('recipe'))
                ? "restaurant" : "cart"
              } 
              size={20} 
              color={isCurrentList ? colors.primary : colors.textSecondary} 
            />
          </View>
          <View style={styles.listInfo}>
            <Text style={[styles.listTitle, isCurrentList && styles.currentListTitle]}>{item.name}</Text>
            <Text style={styles.listSubtitle}>{getSubtitle()}</Text>
          </View>
        </View>
        
        <View style={styles.listActions}>
          {isCurrentList && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditList(item.id, item.name)}
          >
            <Ionicons name="pencil" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => deleteList(item.id)}
          >
            <Ionicons name="trash" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCreateButton = () => (
    <TouchableOpacity style={styles.createButton} onPress={createNewList}>
      <View style={styles.createButtonContent}>
        <Ionicons name="add" size={24} color={colors.primary} />
        <Text style={styles.createButtonText}>Create New List</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="list" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Hello {userName.split(' ')[0]}!</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shopping Lists</Text>
          <Text style={styles.sectionSubtitle}>Manage your shopping lists</Text>
        </View>

        <FlatList
          data={lists}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderCreateButton}
        />
      </View>

      <NameInputModal
        visible={editingList !== null}
        onClose={handleCancelEdit}
        onConfirm={handleUpdateListName}
        title="Rename List"
        description="Enter a new name for your shopping list"
        placeholder="List name"
        defaultValue={editingList?.name || ''}
        confirmText="Save"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 70,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
  },
  listContainer: {
    flexGrow: 1,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listIcon: {
    marginRight: spacing.md,
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  listSubtitle: {
    ...typography.caption,
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  currentBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  currentBadgeText: {
    ...typography.muted,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  actionButton: {
    padding: spacing.xs,
  },
  createButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  createButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentListCard: {
    borderColor: colors.primary,
  },
  currentListTitle: {
    color: colors.primary,
  },
});