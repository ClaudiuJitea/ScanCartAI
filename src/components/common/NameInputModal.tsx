import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../utils/constants';

interface NameInputModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  title: string;
  description: string;
  placeholder: string;
  defaultValue?: string;
  confirmText?: string;
}

export const NameInputModal: React.FC<NameInputModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  description,
  placeholder,
  defaultValue = '',
  confirmText = 'Create',
}) => {
  const [inputValue, setInputValue] = useState<string>(defaultValue);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setInputValue(defaultValue);
      // Focus the input after a short delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible, defaultValue]);

  const handleConfirm = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue) {
      onConfirm(trimmedValue);
      setInputValue('');
    }
  };

  const handleClose = () => {
    setInputValue('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header with icon */}
          <View style={styles.modalHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="list-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalDescription}>
              {description}
            </Text>
          </View>

          {/* Input section */}
          <View style={styles.inputSection}>
            <TextInput
              ref={inputRef}
              style={styles.nameInput}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoCorrect={true}
              autoFocus={false}
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={handleConfirm}
              multiline={false}
              numberOfLines={1}
              maxLength={50}
            />
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleConfirm}
              style={[
                styles.confirmButton,
                !inputValue.trim() && styles.confirmButtonDisabled
              ]}
              disabled={!inputValue.trim()}
            >
              <Text style={[
                styles.confirmButtonText,
                !inputValue.trim() && styles.confirmButtonTextDisabled
              ]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: spacing.lg,
  },
  nameInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 16,
    textAlign: 'center',
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
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    ...typography.body,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonTextDisabled: {
    color: colors.textMuted,
  },
});