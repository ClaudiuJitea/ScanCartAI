import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { colors, typography, spacing, borderRadius } from '../utils/constants';
import { Card } from '../components/common';
import { useShoppingList } from '../hooks/useShoppingList';
import { openRouterService } from '../services/openRouterService';

export const SettingsScreen: React.FC = () => {
  const { lists, clearStorage } = useShoppingList();
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [userName, setUserName] = useState<string>('User');
  const [tempUserName, setTempUserName] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const inputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadApiKey();
    loadUserName();
  }, []);

  const loadApiKey = async () => {
    try {
      const storedApiKey = await SecureStore.getItemAsync('openrouter_api_key');
      if (storedApiKey) {
        setApiKey(storedApiKey);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  };

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

  const saveUserName = async () => {
    try {
      if (tempUserName.trim()) {
        await SecureStore.setItemAsync('user_name', tempUserName.trim());
        setUserName(tempUserName.trim());
        setSuccessMessage('Name updated successfully.');
        setShowSuccessModal(true);
      } else {
        Alert.alert('Error', 'Please enter a valid name.');
        return;
      }
      setShowAccountModal(false);
      setTempUserName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save name. Please try again.');
      console.error('Error saving user name:', error);
    }
  };

  const openAccountModal = () => {
    setTempUserName(userName);
    setShowAccountModal(true);
    // Focus the input after a short delay to ensure modal is rendered
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 500);
  };

  const saveApiKey = async () => {
    try {
      if (tempApiKey.trim()) {
        await SecureStore.setItemAsync('openrouter_api_key', tempApiKey.trim());
        setApiKey(tempApiKey.trim());
        setSuccessMessage('API key saved successfully.');
        setShowSuccessModal(true);
      } else {
        await SecureStore.deleteItemAsync('openrouter_api_key');
        setApiKey('');
        setSuccessMessage('API key removed successfully.');
        setShowSuccessModal(true);
      }
      setShowApiKeyModal(false);
      setTempApiKey('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key. Please try again.');
      console.error('Error saving API key:', error);
    }
  };

  const openApiKeyModal = () => {
    setTempApiKey(apiKey);
    setShowApiKeyModal(true);
    // Focus the input after a short delay to ensure modal is rendered
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  };

  const testApiConnection = async () => {
    if (!apiKey.trim()) {
      Alert.alert('No API Key', 'Please set your OpenRouter API key first.');
      return;
    }

    setTestingConnection(true);
    try {
      const isConnected = await openRouterService.testConnection();
      if (isConnected) {
        Alert.alert('Success', 'API connection test successful! Your key is working properly.');
      } else {
        Alert.alert('Connection Failed', 'Unable to connect to OpenRouter. Please check your API key.');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      Alert.alert('Connection Failed', 'Unable to connect to OpenRouter. Please check your API key and internet connection.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all lists and items? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearStorage();
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const totalItems = lists.reduce((total, list) => total + list.items.length, 0);
  const completedItems = lists.reduce(
    (total, list) => total + list.items.filter(item => item.isCompleted).length,
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="settings" size={24} color={colors.primary} />
          <Text style={styles.title}>Settings</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Account Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.accountCard} onPress={openAccountModal}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{userName}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <Card style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{lists.length}</Text>
                <Text style={styles.statLabel}>Lists</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalItems}</Text>
                <Text style={styles.statLabel}>Total Items</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{completedItems}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* API Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Features</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={openApiKeyModal}>
            <View style={styles.settingLeft}>
              <Ionicons name="key-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>OpenRouter API Key</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {apiKey ? '••••••••••••' : 'Not Set'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
          
          {apiKey && (
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={testApiConnection}
              disabled={testingConnection}
            >
              <View style={styles.settingLeft}>
                <Ionicons 
                  name={testingConnection ? "sync-outline" : "checkmark-circle-outline"} 
                  size={20} 
                  color={colors.textSecondary} 
                />
                <Text style={styles.settingText}>Test Connection</Text>
              </View>
              <View style={styles.settingRight}>
                {testingConnection && (
                  <Text style={styles.settingValue}>Testing...</Text>
                )}
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="color-palette-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>Theme</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>Dark</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>Language</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>English</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>Export Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>Import Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerItem]}
            onPress={handleClearAllData}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.settingText, styles.dangerText]}>Clear All Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>App Version</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* API Key Modal */}
      <Modal
        visible={showApiKeyModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowApiKeyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header with icon */}
            <View style={styles.modalHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="key" size={32} color={colors.primary} />
              </View>
              <Text style={styles.modalTitle}>OpenRouter API Key</Text>
              <Text style={styles.modalDescription}>
                Enter your API key to enable AI-powered list scanning features. 
                Your key is stored securely on your device.
              </Text>
            </View>

            {/* Input section */}
            <View style={styles.inputSection}>
              <TextInput
                ref={inputRef}
                style={styles.apiKeyInput}
                value={tempApiKey}
                onChangeText={setTempApiKey}
                placeholder="Enter your OpenRouter API key"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={false}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={saveApiKey}
                keyboardType="default"
                multiline={false}
                numberOfLines={1}
              />
            </View>


            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => setShowApiKeyModal(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={saveApiKey}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Account Edit Modal */}
      <Modal
        visible={showAccountModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header with icon */}
            <View style={styles.modalHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="person" size={32} color={colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Edit Account</Text>
              <Text style={styles.modalDescription}>
                Update your display name. This name will be shown throughout the app.
              </Text>
            </View>

            {/* Input section */}
            <View style={styles.inputSection}>
              <TextInput
                ref={nameInputRef}
                style={styles.apiKeyInput}
                value={tempUserName}
                onChangeText={setTempUserName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus={false}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={saveUserName}
                keyboardType="default"
                multiline={false}
                numberOfLines={1}
              />
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => setShowAccountModal(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={saveUserName}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successModalHeader}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              <Text style={styles.successModalTitle}>Success</Text>
            </View>
            
            <Text style={styles.successModalMessage}>
              {successMessage}
            </Text>
            
            <TouchableOpacity 
              style={styles.successModalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  title: {
    ...typography.h2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 20,
  },
  accountInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  accountName: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  accountSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 18,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  statsCard: {
    padding: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    ...typography.body,
    marginLeft: spacing.md,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingValue: {
    ...typography.body,
    color: colors.textMuted,
  },
  dangerItem: {
    // Additional styles for danger items if needed
  },
  dangerText: {
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 15,
  },
  inputSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  apiKeyInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 16,
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderRightColor: colors.border,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    borderLeftWidth: 0.5,
    borderLeftColor: colors.border,
  },
  confirmButtonText: {
    ...typography.body,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    margin: spacing.lg,
    minWidth: 300,
    maxWidth: '90%',
    alignItems: 'center',
  },
  successModalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successModalTitle: {
    ...typography.h2,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  successModalMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  successModalButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minWidth: 100,
    alignItems: 'center',
  },
  successModalButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});