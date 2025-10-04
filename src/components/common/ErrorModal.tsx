import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../utils/constants';

interface ErrorModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  onClose,
  title = "Error",
  message,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header with error icon */}
          <View style={styles.modalHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={48} color={colors.error} />
            </View>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalMessage}>
              {message}
            </Text>
          </View>

          {/* Action button */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.singleButton}
            >
              <Text style={styles.singleButtonText}>OK</Text>
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
    maxWidth: 360,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  modalMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  singleButton: {
    flex: 1,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
  },
  singleButtonText: {
    ...typography.body,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});