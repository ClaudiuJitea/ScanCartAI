import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../utils/constants';
import { Recipe } from '../../services/openRouterService';

interface RecipeModalProps {
  visible: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  loading: boolean;
  dishName: string;
}

const { width } = Dimensions.get('window');

export const RecipeModal: React.FC<RecipeModalProps> = ({
  visible,
  onClose,
  recipe,
  loading,
  dishName,
}) => {
  const [currentSection, setCurrentSection] = useState<'ingredients' | 'steps'>('ingredients');
  const slideAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return colors.success;
      case 'Medium':
        return '#ff9500';
      case 'Hard':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Recipe</Text>
        <View style={styles.placeholder} />
      </View>
      
      {recipe && (
        <View style={styles.dishInfo}>
          <Text style={styles.dishName}>{recipe.title}</Text>
          <Text style={styles.dishDescription}>{recipe.description}</Text>
          
          <View style={styles.recipeStats}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color={colors.textMuted} />
              <Text style={styles.statText}>{recipe.servings} servings</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={16} color={colors.textMuted} />
              <Text style={styles.statText}>{recipe.totalTime}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={16} color={getDifficultyColor(recipe.difficulty)} />
              <Text style={[styles.statText, { color: getDifficultyColor(recipe.difficulty) }]}>
                {recipe.difficulty}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, currentSection === 'ingredients' && styles.activeTab]}
        onPress={() => setCurrentSection('ingredients')}
      >
        <Ionicons 
          name="list" 
          size={20} 
          color={currentSection === 'ingredients' ? colors.primary : colors.textMuted} 
        />
        <Text style={[
          styles.tabText, 
          currentSection === 'ingredients' && styles.activeTabText
        ]}>
          Ingredients
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, currentSection === 'steps' && styles.activeTab]}
        onPress={() => setCurrentSection('steps')}
      >
        <Ionicons 
          name="receipt" 
          size={20} 
          color={currentSection === 'steps' ? colors.primary : colors.textMuted} 
        />
        <Text style={[
          styles.tabText, 
          currentSection === 'steps' && styles.activeTabText
        ]}>
          Instructions
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderIngredients = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ingredients</Text>
      {recipe?.ingredients.map((ingredient, index) => (
        <View key={index} style={styles.ingredientItem}>
          <View style={styles.ingredientBullet} />
          <Text style={styles.ingredientText}>{ingredient}</Text>
        </View>
      ))}
      
      {recipe?.nutritionNotes && (
        <View style={styles.nutritionSection}>
          <Text style={styles.nutritionTitle}>Nutrition Notes</Text>
          <Text style={styles.nutritionText}>{recipe.nutritionNotes}</Text>
        </View>
      )}
    </View>
  );

  const renderSteps = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Instructions</Text>
      <View style={styles.timeBreakdown}>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Prep</Text>
          <Text style={styles.timeValue}>{recipe?.prepTime}</Text>
        </View>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Cook</Text>
          <Text style={styles.timeValue}>{recipe?.cookTime}</Text>
        </View>
      </View>
      
      {recipe?.steps.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepInstruction}>{step.instruction}</Text>
            {step.duration && (
              <Text style={styles.stepDuration}>⏱️ {step.duration}</Text>
            )}
            {step.tips && (
              <Text style={styles.stepTip}>💡 {step.tips}</Text>
            )}
          </View>
        </View>
      ))}
      
      {recipe?.tips && recipe.tips.length > 0 && (
        <View style={styles.tipsSection}>
          <Text style={styles.tipsSectionTitle}>Chef's Tips</Text>
          {recipe.tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Ionicons name="bulb" size={16} color={colors.primary} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Generating recipe for {dishName}...</Text>
        </View>
      );
    }

    if (!recipe) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Recipe Not Available</Text>
          <Text style={styles.errorText}>
            We couldn't generate a recipe for "{dishName}". Please try again later.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabBar()}
        {currentSection === 'ingredients' ? renderIngredients() : renderSteps()}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: slideAnim,
            },
          ]}
        >
          {renderHeader()}
          {renderContent()}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  dishInfo: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  dishName: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dishDescription: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  recipeStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    margin: spacing.lg,
    padding: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: spacing.md,
    marginTop: 8,
  },
  ingredientText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  nutritionSection: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  nutritionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  nutritionText: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  timeBreakdown: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  timeValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: spacing.xs,
  },
  stepDuration: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  stepTip: {
    ...typography.caption,
    color: colors.primary,
    fontStyle: 'italic',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  tipsSection: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  tipsSectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tipText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});