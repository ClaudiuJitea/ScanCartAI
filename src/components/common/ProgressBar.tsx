import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../utils/constants';

interface ProgressBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  completed, 
  total, 
  showLabel = true 
}) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = percentage === 100;

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {isComplete ? 'All done!' : `${completed} of ${total} items`}
          </Text>
          <Text style={styles.percentage}>
            {Math.round(percentage)}%
          </Text>
        </View>
      )}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${percentage}%` },
              isComplete && styles.progressComplete
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  percentage: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
  },
  progressBackground: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    transition: 'width 0.3s ease',
  },
  progressComplete: {
    backgroundColor: colors.success,
  },
});