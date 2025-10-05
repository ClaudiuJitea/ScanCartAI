import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { colors, typography, spacing, borderRadius } from '../utils/constants';
import { Card, ThemedDialog } from '../components/common';
import { useShoppingList } from '../hooks/useShoppingList';
import { useThemedDialog } from '../hooks/useThemedDialog';
import { openRouterService } from '../services/openRouterService';
import { createBackup, restoreBackupFromUri } from '../services/backupService';

export const SettingsScreen: React.FC = () => {
  const { lists, clearStorage, initializeStore } = useShoppingList();
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [userName, setUserName] = useState<string>('User');
  const [tempUserName, setTempUserName] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { dialogConfig, showDialog, closeDialog } = useThemedDialog();
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
        showDialog({
          title: 'Name Required',
          message: 'Please enter a valid name before saving.',
          appearance: 'info',
        });
        return;
      }
      setShowAccountModal(false);
      setTempUserName('');
    } catch (error) {
      showDialog({
        title: 'Save Failed',
        message: 'We could not update your name. Please try again.',
        appearance: 'error',
      });
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
      showDialog({
        title: 'Save Failed',
        message: 'We could not update your API key. Please try again.',
        appearance: 'error',
      });
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
      showDialog({
        title: 'API Key Needed',
        message: 'Add your OpenRouter API key in settings before testing the connection.',
        appearance: 'info',
      });
      return;
    }

    setTestingConnection(true);
    try {
      const isConnected = await openRouterService.testConnection();
      if (isConnected) {
        setSuccessMessage('API connection test successful! Your key is working properly.');
        setShowSuccessModal(true);
      } else {
        showDialog({
          title: 'Connection Failed',
          message: 'We could not connect to OpenRouter. Please double-check your API key.',
          appearance: 'error',
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      showDialog({
        title: 'Connection Failed',
        message: 'We could not reach OpenRouter. Check your API key and internet connection, then try again.',
        appearance: 'error',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const backupResult = await createBackup();
      const listsLabel = backupResult.listCount === 1 ? 'list' : 'lists';
      const itemsLabel = backupResult.itemCount === 1 ? 'item' : 'items';

      if (await Sharing.isAvailableAsync()) {
        try {
          await Sharing.shareAsync(backupResult.fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export Lists',
            UTI: 'public.json',
          });
        } catch (shareError) {
          console.warn('Share action was cancelled or failed:', shareError);
        }
      }

      setSuccessMessage(`Exported ${backupResult.listCount} ${listsLabel} (${backupResult.itemCount} ${itemsLabel}). Saved as ${backupResult.fileName}.`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error exporting data:', error);
      showDialog({
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'Could not export data. Please try again.',
        appearance: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    try {
      setIsImporting(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        throw new Error('Unable to read the selected file.');
      }

      const summary = await restoreBackupFromUri(asset.uri);
      await initializeStore();

      const listsLabel = summary.listCount === 1 ? 'list' : 'lists';
      const itemsLabel = summary.itemCount === 1 ? 'item' : 'items';
      setSuccessMessage(`Imported ${summary.listCount} ${listsLabel} with ${summary.itemCount} ${itemsLabel}.`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error importing data:', error);
      showDialog({
        title: 'Import Failed',
        message: error instanceof Error ? error.message : 'Could not import data. Please try again.',
        appearance: 'error',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearAllData = () => {
    setShowClearDataModal(true);
  };

  const openPrivacyPolicy = () => {
    setShowPrivacyModal(true);
  };

  const confirmClearAllData = async () => {
    setIsClearingData(true);
    try {
      await clearStorage();
      setShowClearDataModal(false);
      setSuccessMessage('All data has been cleared.');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error clearing data:', error);
      showDialog({
        title: 'Clear Failed',
        message: 'We could not clear your data. Please try again.',
        appearance: 'error',
      });
    } finally {
      setIsClearingData(false);
    }
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

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        
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

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, isExporting && styles.settingItemDisabled]}
            onPress={handleExportData}
            disabled={isExporting}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>Export Data</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{isExporting ? 'Preparing...' : 'JSON'}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, isImporting && styles.settingItemDisabled]}
            onPress={handleImportData}
            disabled={isImporting}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.settingText}>Import Data</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{isImporting ? 'Loading...' : 'JSON'}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
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


          <TouchableOpacity
            style={styles.settingItem}
            onPress={openPrivacyPolicy}
          >
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

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successModalHeader}>
              <Ionicons name="document-text-outline" size={32} color={colors.primary} />
              <Text style={styles.successModalTitle}>Privacy Policy</Text>
            </View>

            <Text style={styles.successModalMessage}>
              ScanCart stores every list, item, and setting directly on your device. We never upload your data, track usage, or share it with anyone. Managing your groceries stays 100% private and in your control.
            </Text>

            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => setShowPrivacyModal(false)}
            >
              <Text style={styles.successModalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Clear Data Modal */}
      <Modal
        visible={showClearDataModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          if (!isClearingData) {
            setShowClearDataModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={[styles.iconContainer, styles.dangerIconContainer]}>
                <Ionicons name="trash" size={32} color={colors.error} />
              </View>
              <Text style={styles.modalTitle}>Clear All Data</Text>
              <Text style={styles.modalDescription}>
                Are you sure you want to delete all lists and items? This action cannot be undone.
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => setShowClearDataModal(false)}
                style={styles.cancelButton}
                disabled={isClearingData}
              >
                <Text style={[styles.cancelButtonText, isClearingData && styles.disabledButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmClearAllData}
                style={[styles.confirmButton, styles.dangerButton]}
                disabled={isClearingData}
              >
                <Text style={[
                  styles.confirmButtonText,
                  styles.dangerButtonText,
                  isClearingData && styles.disabledButtonText,
                ]}>{isClearingData ? 'Deleting...' : 'Delete'}</Text>
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

      <ThemedDialog
        visible={Boolean(dialogConfig)}
        title={dialogConfig?.title ?? ''}
        message={dialogConfig?.message ?? ''}
        appearance={dialogConfig?.appearance}
        onClose={closeDialog}
        primaryAction={{
          label: dialogConfig?.primaryLabel ?? 'OK',
          onPress: dialogConfig?.onPrimary,
          variant: dialogConfig?.primaryVariant ?? 'primary',
        }}
        secondaryAction={dialogConfig?.secondaryLabel
          ? { label: dialogConfig.secondaryLabel, onPress: dialogConfig.onSecondary }
          : undefined
        }
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
  title: {
    ...typography.h2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xxl + spacing.xl,
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
  settingItemDisabled: {
    opacity: 0.6,
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
  dangerIconContainer: {
    backgroundColor: `${colors.error}15`,
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
  dangerButton: {
    backgroundColor: `${colors.error}12`,
  },
  dangerButtonText: {
    color: colors.error,
  },
  disabledButtonText: {
    color: colors.textMuted,
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
