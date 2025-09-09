import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../utils/constants';
import { OpenFoodFactsProduct } from '../../services/openFoodFactsService';

interface ProductDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  product: OpenFoodFactsProduct | null;
  loading: boolean;
  productName: string; // Fallback name from shopping list
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  visible,
  onClose,
  product,
  loading,
  productName,
}) => {
  if (!visible) {
    return null;
  }
  const renderNutrition = () => {
    if (!product?.product.nutriments) return null;

    const nutrients = [
      { key: 'energy_100g', label: 'Energy', unit: 'kcal', icon: 'flash' },
      { key: 'fat_100g', label: 'Fat', unit: 'g', icon: 'water' },
      { key: 'carbohydrates_100g', label: 'Carbs', unit: 'g', icon: 'leaf' },
      { key: 'sugars_100g', label: 'Sugars', unit: 'g', icon: 'cube' },
      { key: 'proteins_100g', label: 'Protein', unit: 'g', icon: 'fitness' },
      { key: 'salt_100g', label: 'Salt', unit: 'g', icon: 'ellipse' },
    ];

    const availableNutrients = nutrients.filter(n => 
      product.product.nutriments[n.key] !== undefined
    );

    if (availableNutrients.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition (per 100g)</Text>
        <View style={styles.nutritionGrid}>
          {availableNutrients.map((nutrient) => (
            <View key={nutrient.key} style={styles.nutritionItem}>
              <Ionicons 
                name={nutrient.icon as any} 
                size={20} 
                color={colors.primary} 
                style={styles.nutritionIcon}
              />
              <Text style={styles.nutritionLabel}>{nutrient.label}</Text>
              <Text style={styles.nutritionValue}>
                {product.product.nutriments[nutrient.key]} {nutrient.unit}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderIngredients = () => {
    if (!product?.product.ingredients_text) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <Text style={styles.ingredientsText}>
          {product.product.ingredients_text}
        </Text>
      </View>
    );
  };

  const renderBasicInfo = () => {
    const prod = product?.product;
    if (!prod) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Information</Text>
        
        {prod.brands && (
          <View style={styles.infoRow}>
            <Ionicons name="business" size={16} color={colors.textMuted} />
            <Text style={styles.infoLabel}>Brand:</Text>
            <Text style={styles.infoValue}>{prod.brands.split(',')[0]}</Text>
          </View>
        )}
        
        {prod.quantity && (
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={16} color={colors.textMuted} />
            <Text style={styles.infoLabel}>Quantity:</Text>
            <Text style={styles.infoValue}>{prod.quantity}</Text>
          </View>
        )}
        
        {prod.categories && (
          <View style={styles.infoRow}>
            <Ionicons name="pricetag" size={16} color={colors.textMuted} />
            <Text style={styles.infoLabel}>Categories:</Text>
            <Text style={styles.infoValue}>
              {prod.categories.split(',').slice(0, 2).join(', ')}
            </Text>
          </View>
        )}

        {product.code && (
          <View style={styles.infoRow}>
            <Ionicons name="barcode" size={16} color={colors.textMuted} />
            <Text style={styles.infoLabel}>Barcode:</Text>
            <Text style={styles.infoValue}>{product.code}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Modern Header with Glassmorphism Effect */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <View style={styles.closeButtonBackground}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </View>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Product Details</Text>
              <View style={styles.headerLine} />
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <View style={styles.loadingIconContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
              <Text style={styles.loadingTitle}>Fetching Product Info</Text>
              <Text style={styles.loadingSubtitle}>Getting details from Open Food Facts...</Text>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Modern Product Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.productImageContainer}>
                {product?.product.image_front_url ? (
                  <Image 
                    source={{ uri: product.product.image_front_url }} 
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="cube-outline" size={64} color={colors.primary} />
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}
                <View style={styles.imageOverlay} />
              </View>
              
              <View style={styles.productInfo}>
                <Text style={styles.productTitle}>
                  {product?.product.product_name || product?.product.product_name_en || productName}
                </Text>
                {product?.product.brands && (
                  <Text style={styles.brandName}>{product.product.brands.split(',')[0]}</Text>
                )}
                {product?.status === 0 ? (
                  <View style={styles.statusBadge}>
                    <Ionicons name="alert-circle" size={16} color={colors.error} />
                    <Text style={styles.statusText}>Not Found</Text>
                  </View>
                ) : (
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.statusTextSuccess}>Verified Product</Text>
                  </View>
                )}
              </View>
            </View>

            {product?.status === 1 ? (
              <>
                {renderBasicInfo()}
                {renderNutrition()}
                {renderIngredients()}
                
                {/* Data Source */}
                <View style={styles.dataSource}>
                  <Ionicons name="information-circle" size={16} color={colors.textMuted} />
                  <Text style={styles.dataSourceText}>
                    Data provided by Open Food Facts - The free food database
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="search" size={48} color={colors.textMuted} />
                <Text style={styles.noDataTitle}>No Product Data Found</Text>
                <Text style={styles.noDataText}>
                  This product is not available in the Open Food Facts database yet.
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60, // Safe area
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    zIndex: 10,
  },
  closeButtonBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
  },
  headerTitle: {
    ...typography.h2,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerLine: {
    width: 40,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    minWidth: 280,
  },
  loadingIconContainer: {
    marginBottom: spacing.lg,
  },
  loadingTitle: {
    ...typography.h3,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  loadingSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Modern Hero Section Styles
  heroSection: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  productImageContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: -10,
    width: 120,
    height: 20,
    backgroundColor: colors.surface,
    borderRadius: 60,
    opacity: 0.3,
  },
  productImage: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  placeholderImage: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  productInfo: {
    alignItems: 'center',
  },
  productTitle: {
    ...typography.h2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  brandName: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  statusTextSuccess: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  notFoundBadge: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  notFoundText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '500',
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
    color: colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textMuted,
    minWidth: 80,
  },
  infoValue: {
    ...typography.body,
    flex: 1,
    fontWeight: '500',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  nutritionItem: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: '45%',
    alignItems: 'center',
  },
  nutritionIcon: {
    marginBottom: spacing.xs,
  },
  nutritionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  nutritionValue: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  ingredientsText: {
    ...typography.body,
    lineHeight: 24,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dataSource: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  dataSourceText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 18,
  },
  noDataContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  noDataTitle: {
    ...typography.h3,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  noDataText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});