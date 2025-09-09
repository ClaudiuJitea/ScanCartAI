import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { HomeStackParamList } from '../navigation/types';
import { colors, typography, spacing, borderRadius } from '../utils/constants';
import { Input, ProgressBar, RecipeModal } from '../components/common';
import { ProductDetailsModal } from '../components/common/ProductDetailsModal';
import { QuantityPicker } from '../components/shopping/QuantityPicker';
import { BarcodeScanner } from '../components/shopping/BarcodeScanner';
import { useShoppingList } from '../hooks/useShoppingList';
import { ShoppingItem } from '../types/ShoppingList';
import { ProcessedProduct, openFoodFactsService, OpenFoodFactsProduct } from '../services/openFoodFactsService';
import { openRouterService, Recipe } from '../services/openRouterService';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeScreen'>;

export const HomeScreen: React.FC<Props> = ({ navigation, route }) => {
  const [newItemText, setNewItemText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isBarcodeScannerVisible, setIsBarcodeScannerVisible] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [selectedProductName, setSelectedProductName] = useState('');
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);
  const [showNoBarcodeModal, setShowNoBarcodeModal] = useState(false);
  const [noBarcodeItemName, setNoBarcodeItemName] = useState('');
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const listId = route.params?.listId;
  
  const { 
    getCurrentList, 
    addItemToCurrentList, 
    toggleItemCompletion, 
    removeItemFromCurrentList,
    updateItemInCurrentList,
    initializeStore,
    setCurrentList,
    loading 
  } = useShoppingList();

  useEffect(() => {
    initializeStore();
  }, []);

  // Handle navigation to specific list
  useFocusEffect(
    React.useCallback(() => {
      if (listId) {
        setCurrentList(listId);
      }
    }, [listId, setCurrentList])
  );

  const currentList = getCurrentList();
  const allItems = currentList?.items || [];
  
  
  // Filter items based on search text
  const items = searchText 
    ? allItems.filter(item => 
        item.name.toLowerCase().includes(searchText.toLowerCase())
      )
    : allItems;

  // Calculate progress
  const completedItems = allItems.filter(item => item.isCompleted).length;
  const totalItems = allItems.length;

  const getDefaultUnit = (itemName: string): string => {
    const name = itemName.toLowerCase();
    
    // Produce/fruits/vegetables - usually by weight or pieces
    if (['apple', 'banana', 'orange', 'tomato', 'onion', 'potato'].some(item => name.includes(item))) {
      return 'pcs';
    }
    
    // Meat/deli - usually by weight
    if (['meat', 'chicken', 'beef', 'pork', 'fish', 'salmon', 'turkey'].some(item => name.includes(item))) {
      return 'kg';
    }
    
    // Dairy/liquids - usually by volume
    if (['milk', 'juice', 'water', 'soda', 'beer', 'wine', 'cream'].some(item => name.includes(item))) {
      return 'L';
    }
    
    // Bread/bakery - usually pieces
    if (['bread', 'rolls', 'bagel', 'muffin', 'donut'].some(item => name.includes(item))) {
      return 'loaf';
    }
    
    // Eggs - dozens
    if (name.includes('egg')) {
      return 'dozen';
    }
    
    // Cheese - weight
    if (name.includes('cheese')) {
      return 'g';
    }
    
    // Rice/pasta/grains - weight
    if (['rice', 'pasta', 'flour', 'sugar', 'salt'].some(item => name.includes(item))) {
      return 'kg';
    }
    
    // Default unit
    return 'pcs';
  };

  const addItem = async () => {
    if (newItemText.trim()) {
      await addItemToCurrentList({
        name: newItemText.trim(),
        category: 'other',
        quantity: 1,
        unit: getDefaultUnit(newItemText.trim()),
        isCompleted: false,
      });
      setNewItemText('');
    }
  };

  const updateItemQuantity = async (itemId: string, quantity: number) => {
    await updateItemInCurrentList(itemId, { quantity });
  };

  const toggleItem = async (id: string) => {
    await toggleItemCompletion(id);
  };

  const deleteItem = async (id: string) => {
    await removeItemFromCurrentList(id);
  };

  const handleProductScanned = async (product: ProcessedProduct) => {
    try {
      const unit = openFoodFactsService.getDefaultUnit(product);
      await addItemToCurrentList({
        name: product.name,
        category: product.category as any,
        quantity: 1,
        unit: unit,
        barcode: product.barcode,
        isCompleted: false,
      });
    } catch (error) {
      console.error('Error adding scanned product:', error);
    }
  };

  const openBarcodeScanner = () => {
    setIsBarcodeScannerVisible(true);
  };

  const closeBarcodeScanner = () => {
    setIsBarcodeScannerVisible(false);
  };

  const handleItemTap = async (item: ShoppingItem) => {
    if (!item.barcode) {
      setNoBarcodeItemName(item.name);
      setShowNoBarcodeModal(true);
      return;
    }

    setSelectedProductName(item.name);
    setSelectedProduct(null);
    setProductDetailsLoading(true);
    setShowProductDetails(true);

    setTimeout(async () => {
      try {
        const productData = await openFoodFactsService.getFullProductByBarcode(item.barcode);
        setSelectedProduct(productData);
      } catch (error) {
        setSelectedProduct({
          code: item.barcode,
          product: {},
          status: 0,
          status_verbose: 'product not found'
        });
      } finally {
        setProductDetailsLoading(false);
      }
    }, 100);
  };

  const closeProductDetails = () => {
    setShowProductDetails(false);
    setSelectedProduct(null);
    setSelectedProductName('');
    setProductDetailsLoading(false);
  };

  const generateRecipe = async () => {
    if (!currentList?.name) return;
    
    setRecipeLoading(true);
    setCurrentRecipe(null);
    setShowRecipeModal(true);

    try {
      const recipe = await openRouterService.generateRecipe(currentList.name);
      setCurrentRecipe(recipe);
    } catch (error) {
      console.error('Error generating recipe:', error);
      let errorMessage = 'Failed to generate recipe. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = 'Please set your OpenRouter API key in settings first.';
        } else if (error.message.includes('OpenRouter API error')) {
          errorMessage = 'AI service error. Please check your API key and try again.';
        }
      }
      
      Alert.alert('Error', errorMessage);
      setShowRecipeModal(false);
    } finally {
      setRecipeLoading(false);
    }
  };

  const closeRecipeModal = () => {
    setShowRecipeModal(false);
    setCurrentRecipe(null);
    setRecipeLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Your list is empty</Text>
      <Text style={styles.emptySubtitle}>
        Add items above to get started with your{'\n'}shopping list
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemLeft}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleItem(item.id)}
          activeOpacity={0.6}
        >
          <View style={[styles.checkbox, item.isCompleted && styles.checkboxCompleted]}>
            {item.isCompleted && (
              <Ionicons name="checkmark" size={16} color={colors.textPrimary} />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleItemTap(item)}
          activeOpacity={0.7}
        >
          <Text style={[styles.itemText, item.isCompleted && styles.itemTextCompleted]}>
            {item.name}
          </Text>
          <View style={styles.itemDetails}>
            {item.unit && (
              <Text style={styles.itemUnit}>
                {item.quantity} {item.unit}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.itemRight}>
        <QuantityPicker
          quantity={item.quantity || 1}
          onQuantityChange={(quantity) => updateItemQuantity(item.id, quantity)}
          style={styles.quantityPicker}
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteItem(item.id)}
        >
          <Ionicons name="trash" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGetRecipeButton = () => (
    <View style={styles.getRecipeContainer}>
      <TouchableOpacity 
        style={styles.getRecipeButton} 
        onPress={generateRecipe}
        disabled={recipeLoading}
      >
        {recipeLoading ? (
          <ActivityIndicator size="small" color={colors.textPrimary} />
        ) : (
          <Ionicons name="restaurant" size={22} color={colors.textPrimary} />
        )}
        <Text style={styles.getRecipeButtonText}>
          {recipeLoading ? 'Generating Recipe...' : 'Get the Recipe'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.titleWithIcon}>
            <Ionicons 
              name={
                (currentList?.isMealPlan || 
                 currentList?.name.toLowerCase().includes('soup') ||
                 currentList?.name.toLowerCase().includes('dish') ||
                 currentList?.name.toLowerCase().includes('recipe')) 
                ? "restaurant" : "cart"
              } 
              size={22} 
              color={colors.primary} 
              style={styles.titleIcon}
            />
            <Text 
              style={styles.title} 
              numberOfLines={1} 
              ellipsizeMode="tail"
            >
              {currentList?.name || 'Shopping List'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.barcodeButton}
            onPress={openBarcodeScanner}
          >
            <Ionicons 
              name="barcode-outline" 
              size={24} 
              color={colors.textPrimary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => setIsSearchVisible(!isSearchVisible)}
          >
            <Ionicons 
              name={isSearchVisible ? "close" : "search"} 
              size={24} 
              color={colors.textPrimary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {isSearchVisible && (
          <View style={styles.searchContainer}>
            <Input
              placeholder="Search items..."
              value={searchText}
              onChangeText={setSearchText}
              style={styles.searchInput}
              leftIcon={<Ionicons name="search" size={20} color={colors.textMuted} />}
              rightIcon={
                searchText ? (
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null
              }
            />
          </View>
        )}
        
        {totalItems > 0 && (
          <ProgressBar 
            completed={completedItems} 
            total={totalItems} 
          />
        )}
        
        <View style={styles.addItemContainer}>
          <Input
            placeholder="Add new item..."
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={addItem}
            returnKeyType="done"
            style={styles.addInput}
            onRightIconPress={newItemText.trim() ? addItem : undefined}
            rightIcon={
              <View style={[styles.addButton, !newItemText.trim() && styles.addButtonDisabled]}>
                <Ionicons 
                  name="add" 
                  size={24} 
                  color={newItemText.trim() ? colors.textPrimary : colors.textMuted} 
                />
              </View>
            }
          />
        </View>

        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            (currentList?.isMealPlan || 
             currentList?.name.toLowerCase().includes('soup') ||
             currentList?.name.toLowerCase().includes('dish') ||
             currentList?.name.toLowerCase().includes('recipe')) 
            ? renderGetRecipeButton : null
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={isBarcodeScannerVisible}
        onClose={closeBarcodeScanner}
        onProductScanned={handleProductScanned}
      />

      {/* No Barcode Modal */}
      <Modal
        visible={showNoBarcodeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNoBarcodeModal(false)}
      >
        <View style={styles.noBarcodeModalOverlay}>
          <View style={styles.noBarcodeModal}>
            <View style={styles.noBarcodeModalHeader}>
              <Ionicons name="information-circle" size={32} color={colors.primary} />
              <Text style={styles.noBarcodeModalTitle}>Product Details</Text>
            </View>
            
            <Text style={styles.noBarcodeModalMessage}>
              No barcode available for "<Text style={styles.noBarcodeItemName}>{noBarcodeItemName}</Text>". Product details are only available for items added via barcode scanning.
            </Text>
            
            <TouchableOpacity 
              style={styles.noBarcodeModalButton}
              onPress={() => setShowNoBarcodeModal(false)}
            >
              <Text style={styles.noBarcodeModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Product Details Modal */}
      <ProductDetailsModal
        visible={showProductDetails}
        onClose={closeProductDetails}
        product={selectedProduct}
        loading={productDetailsLoading}
        productName={selectedProductName}
      />

      {/* Recipe Modal */}
      <RecipeModal
        visible={showRecipeModal}
        onClose={closeRecipeModal}
        recipe={currentRecipe}
        loading={recipeLoading}
        dishName={currentList?.name || ''}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  titleIcon: {
    marginRight: spacing.xs,
  },
  title: {
    ...typography.h2,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barcodeButton: {
    padding: spacing.xs,
  },
  searchButton: {
    padding: spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  searchContainer: {
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surface,
  },
  addItemContainer: {
    marginBottom: spacing.lg,
  },
  addInput: {
    paddingRight: 60,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.border,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxContainer: {
    marginRight: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  itemTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemUnit: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  barcodeHint: {
    ...typography.caption,
    color: colors.primary,
    fontStyle: 'italic',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantityPicker: {
    // Custom styles if needed
  },
  deleteButton: {
    padding: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // No Barcode Modal Styles
  noBarcodeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noBarcodeModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    margin: spacing.lg,
    minWidth: 300,
    maxWidth: '90%',
    alignItems: 'center',
  },
  noBarcodeModalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  noBarcodeModalTitle: {
    ...typography.h2,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  noBarcodeModalMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  noBarcodeItemName: {
    color: colors.primary,
    fontWeight: '600',
  },
  noBarcodeModalButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minWidth: 100,
    alignItems: 'center',
  },
  noBarcodeModalButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // Get Recipe Button Styles
  getRecipeContainer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  getRecipeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  getRecipeButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
});