export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category: string;
  notes?: string;
  barcode?: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: Date;
  updatedAt: Date;
  isTemplate: boolean;
  isMealPlan?: boolean; // Flag to identify meal planner lists
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  isCustom: boolean;
}