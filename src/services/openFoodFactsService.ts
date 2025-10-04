import axios from 'axios';

export interface OpenFoodFactsProduct {
  code: string;
  product: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    categories?: string;
    quantity?: string;
    ingredients_text?: string;
    nutriments?: {
      energy_100g?: number;
      fat_100g?: number;
      carbohydrates_100g?: number;
      proteins_100g?: number;
    };
    image_url?: string;
    image_front_url?: string;
  };
  status: number;
  status_verbose: string;
}

export interface ProcessedProduct {
  barcode: string;
  name: string;
  brand?: string;
  quantity?: string;
  category: string;
  imageUrl?: string;
  isValid: boolean;
}

class OpenFoodFactsService {
  private baseUrl = 'https://world.openfoodfacts.org/api/v0';

  /**
   * Fetch complete product information by barcode for details modal
   */
  async getFullProductByBarcode(barcode: string): Promise<OpenFoodFactsProduct> {
    try {
      const response = await axios.get<OpenFoodFactsProduct>(
        `${this.baseUrl}/product/${barcode}.json`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching full product from Open Food Facts:', error);
      throw error;
    }
  }

  /**
   * Fetch product information by barcode
   */
  async getProductByBarcode(barcode: string): Promise<ProcessedProduct> {
    try {
      const response = await axios.get<OpenFoodFactsProduct>(
        `${this.baseUrl}/product/${barcode}.json`
      );

      const { data } = response;
      
      if (data.status === 0) {
        return {
          barcode,
          name: `Unknown Product (${barcode})`,
          category: 'other',
          isValid: false,
        };
      }

      const product = data.product;
      
      // Get the best available product name
      const name = product.product_name || product.product_name_en || `Product ${barcode}`;
      
      // Determine category based on Open Food Facts categories
      const category = this.determineCategory(product.categories || '');
      
      // Get brand information
      const brand = product.brands?.split(',')[0]?.trim();
      
      return {
        barcode,
        name: brand ? `${name} - ${brand}` : name,
        brand,
        quantity: product.quantity || undefined,
        category,
        imageUrl: product.image_front_url || product.image_url,
        isValid: true,
      };
    } catch (error) {
      console.error('Error fetching product from Open Food Facts:', error);
      
      return {
        barcode,
        name: `Unknown Product (${barcode})`,
        category: 'other',
        isValid: false,
      };
    }
  }

  /**
   * Determine shopping category based on Open Food Facts categories
   */
  private determineCategory(categories: string): string {
    const categoryLower = categories.toLowerCase();
    
    // Produce & Fresh
    if (categoryLower.includes('fruit') || categoryLower.includes('vegetable') || 
        categoryLower.includes('fresh') || categoryLower.includes('produce')) {
      return 'produce';
    }
    
    // Dairy
    if (categoryLower.includes('dairy') || categoryLower.includes('milk') || 
        categoryLower.includes('cheese') || categoryLower.includes('yogurt') ||
        categoryLower.includes('butter') || categoryLower.includes('cream')) {
      return 'dairy';
    }
    
    // Meat & Seafood
    if (categoryLower.includes('meat') || categoryLower.includes('beef') || 
        categoryLower.includes('chicken') || categoryLower.includes('pork') ||
        categoryLower.includes('fish') || categoryLower.includes('seafood') ||
        categoryLower.includes('sausage') || categoryLower.includes('ham')) {
      return 'meat';
    }
    
    // Pantry & Canned Goods
    if (categoryLower.includes('canned') || categoryLower.includes('jar') || 
        categoryLower.includes('sauce') || categoryLower.includes('pasta') ||
        categoryLower.includes('rice') || categoryLower.includes('cereal') ||
        categoryLower.includes('grain') || categoryLower.includes('flour')) {
      return 'pantry';
    }
    
    // Frozen Foods
    if (categoryLower.includes('frozen')) {
      return 'frozen';
    }
    
    // Bakery
    if (categoryLower.includes('bread') || categoryLower.includes('bakery') || 
        categoryLower.includes('pastry') || categoryLower.includes('cake') ||
        categoryLower.includes('cookie') || categoryLower.includes('biscuit')) {
      return 'bakery';
    }
    
    // Beverages
    if (categoryLower.includes('beverage') || categoryLower.includes('drink') || 
        categoryLower.includes('juice') || categoryLower.includes('water') ||
        categoryLower.includes('soda') || categoryLower.includes('tea') ||
        categoryLower.includes('coffee') || categoryLower.includes('beer') ||
        categoryLower.includes('wine')) {
      return 'beverages';
    }
    
    // Snacks
    if (categoryLower.includes('snack') || categoryLower.includes('chip') || 
        categoryLower.includes('candy') || categoryLower.includes('chocolate') ||
        categoryLower.includes('sweet') || categoryLower.includes('dessert')) {
      return 'snacks';
    }
    
    // Personal Care
    if (categoryLower.includes('cosmetic') || categoryLower.includes('hygiene') || 
        categoryLower.includes('care') || categoryLower.includes('soap') ||
        categoryLower.includes('shampoo') || categoryLower.includes('toothpaste')) {
      return 'personal-care';
    }
    
    // Household
    if (categoryLower.includes('cleaning') || categoryLower.includes('detergent') || 
        categoryLower.includes('household')) {
      return 'household';
    }
    
    // Default to other
    return 'other';
  }

  /**
   * Get suggested unit based on product information
   */
  getDefaultUnit(product: ProcessedProduct): string {
    const name = product.name.toLowerCase();
    const category = product.category;
    
    // Use quantity info if available
    if (product.quantity) {
      const quantity = product.quantity.toLowerCase();
      if (quantity.includes('ml') || quantity.includes('l')) return 'L';
      if (quantity.includes('g') || quantity.includes('kg')) return 'kg';
      if (quantity.includes('oz') || quantity.includes('lb')) return 'lbs';
    }
    
    // Category-based defaults
    switch (category) {
      case 'produce':
        return name.includes('apple') || name.includes('banana') || 
               name.includes('orange') ? 'pcs' : 'kg';
      case 'dairy':
        return name.includes('milk') || name.includes('cream') ? 'L' : 'pcs';
      case 'meat':
        return 'kg';
      case 'beverages':
        return 'L';
      case 'bakery':
        return name.includes('bread') ? 'loaf' : 'pcs';
      case 'pantry':
        return name.includes('pasta') || name.includes('rice') ? 'kg' : 'pcs';
      default:
        return 'pcs';
    }
  }
}

export const openFoodFactsService = new OpenFoodFactsService();