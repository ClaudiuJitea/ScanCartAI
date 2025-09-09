import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../utils/constants';

interface QuantityPickerProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  style?: any;
}

export const QuantityPicker: React.FC<QuantityPickerProps> = ({
  quantity,
  onQuantityChange,
  style,
}) => {
  const increment = () => {
    onQuantityChange(quantity + 1);
  };

  const decrement = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={[styles.button, quantity <= 1 && styles.buttonDisabled]}
        onPress={decrement}
        disabled={quantity <= 1}
      >
        <Ionicons 
          name="remove" 
          size={16} 
          color={quantity <= 1 ? colors.textMuted : colors.textPrimary} 
        />
      </TouchableOpacity>
      
      <View style={styles.quantityContainer}>
        <Text style={styles.quantityText}>{quantity}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={increment}
      >
        <Ionicons name="add" size={16} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: 2,
  },
  button: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  quantityContainer: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  quantityText: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 14,
  },
});