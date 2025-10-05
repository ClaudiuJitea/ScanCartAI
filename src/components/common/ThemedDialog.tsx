import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "../../utils/constants";

type DialogAppearance = "info" | "success" | "error";

interface DialogAction {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "default" | "danger";
}

interface ThemedDialogProps {
  visible: boolean;
  title: string;
  message: string;
  appearance?: DialogAppearance;
  onClose: () => void;
  primaryAction?: DialogAction;
  secondaryAction?: DialogAction;
}

const ICON_MAP: Record<DialogAppearance, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  info: { name: "information-circle", color: colors.primary },
  success: { name: "checkmark-circle", color: colors.success },
  error: { name: "alert-circle", color: colors.error },
};

export const ThemedDialog: React.FC<ThemedDialogProps> = ({
  visible,
  title,
  message,
  appearance = "info",
  onClose,
  primaryAction,
  secondaryAction,
}) => {
  const icon = ICON_MAP[appearance];

  const handlePrimaryPress = () => {
    primaryAction?.onPress?.();
    onClose();
  };

  const handleSecondaryPress = () => {
    secondaryAction?.onPress?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconWrapper}>
            <Ionicons name={icon.name} size={40} color={icon.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={[styles.actions, !secondaryAction && styles.singleActionRow]}>
            {secondaryAction && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleSecondaryPress}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  {secondaryAction.label}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                primaryAction?.variant === "danger" && styles.dangerButton,
                primaryAction?.variant === "default" && styles.secondaryButton,
              ]}
              onPress={handlePrimaryPress}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  primaryAction?.variant === "default" && styles.secondaryButtonText,
                ]}
              >
                {primaryAction?.label ?? "OK"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: "100%",
    maxWidth: 360,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrapper: {
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  singleActionRow: {
    justifyContent: "center",
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  primaryButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});
