import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, spacing, borderRadius } from '../../utils/constants';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outline';
  padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
  ...props
}) => {
  const cardStyle = [
    styles.card,
    styles[variant],
    { padding: spacing[padding] },
    style,
  ];

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  default: {
    backgroundColor: colors.surface,
  },
  elevated: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
});