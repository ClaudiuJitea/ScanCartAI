import * as SQLite from 'expo-sqlite';
import { ShoppingList, ShoppingItem, Category } from '../types/ShoppingList';

const DATABASE_NAME = 'grocery_list.db';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    
    this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await this.createTables();
    await this.seedDefaultData();
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create shopping_lists table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS shopping_lists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_template INTEGER DEFAULT 0,
        is_meal_plan INTEGER DEFAULT 0
      );
    `);

    // Add is_meal_plan column if it doesn't exist (migration)
    try {
      await this.db.execAsync(`
        ALTER TABLE shopping_lists ADD COLUMN is_meal_plan INTEGER DEFAULT 0;
      `);
    } catch (error) {
      // Column already exists, ignore error
    }

    // Create shopping_items table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS shopping_items (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL,
        name TEXT NOT NULL,
        quantity INTEGER,
        unit TEXT,
        category TEXT NOT NULL,
        notes TEXT,
        is_completed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (list_id) REFERENCES shopping_lists (id) ON DELETE CASCADE
      );
    `);

    // Create categories table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        is_custom INTEGER DEFAULT 0
      );
    `);

    // Create app_settings table for current list tracking
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_shopping_items_list_id ON shopping_items(list_id);
      CREATE INDEX IF NOT EXISTS idx_shopping_items_category ON shopping_items(category);
      CREATE INDEX IF NOT EXISTS idx_shopping_items_completed ON shopping_items(is_completed);
    `);
  }

  private async seedDefaultData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if default list exists
    const existingLists = await this.db.getAllAsync('SELECT COUNT(*) as count FROM shopping_lists');
    const listCount = (existingLists[0] as any).count;

    if (listCount === 0) {
      // Create default list
      const defaultListId = Date.now().toString();
      await this.db.runAsync(
        'INSERT INTO shopping_lists (id, name, created_at, updated_at, is_template, is_meal_plan) VALUES (?, ?, ?, ?, ?, ?)',
        [defaultListId, 'My Shopping List', new Date().toISOString(), new Date().toISOString(), 0, 0]
      );

      // Set as current list
      await this.db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        ['current_list_id', defaultListId]
      );
    }

    // Seed default categories if they don't exist
    const existingCategories = await this.db.getAllAsync('SELECT COUNT(*) as count FROM categories');
    const categoryCount = (existingCategories[0] as any).count;

    if (categoryCount === 0) {
      const defaultCategories = [
        { id: 'produce', name: 'Produce', icon: 'leaf-outline', is_custom: 0 },
        { id: 'dairy', name: 'Dairy', icon: 'water-outline', is_custom: 0 },
        { id: 'meat', name: 'Meat & Seafood', icon: 'fish-outline', is_custom: 0 },
        { id: 'pantry', name: 'Pantry', icon: 'archive-outline', is_custom: 0 },
        { id: 'frozen', name: 'Frozen', icon: 'snow-outline', is_custom: 0 },
        { id: 'bakery', name: 'Bakery', icon: 'restaurant-outline', is_custom: 0 },
        { id: 'snacks', name: 'Snacks', icon: 'fast-food-outline', is_custom: 0 },
        { id: 'beverages', name: 'Beverages', icon: 'wine-outline', is_custom: 0 },
        { id: 'household', name: 'Household', icon: 'home-outline', is_custom: 0 },
        { id: 'personal', name: 'Personal Care', icon: 'medical-outline', is_custom: 0 },
        { id: 'other', name: 'Other', icon: 'ellipsis-horizontal-outline', is_custom: 0 },
      ];

      for (const category of defaultCategories) {
        await this.db.runAsync(
          'INSERT INTO categories (id, name, icon, is_custom) VALUES (?, ?, ?, ?)',
          [category.id, category.name, category.icon, category.is_custom]
        );
      }
    }
  }

  async getAllLists(): Promise<ShoppingList[]> {
    if (!this.db) throw new Error('Database not initialized');

    const lists = await this.db.getAllAsync(`
      SELECT id, name, created_at, updated_at, is_template, is_meal_plan 
      FROM shopping_lists 
      ORDER BY created_at DESC
    `);

    const result: ShoppingList[] = [];

    for (const list of lists as any[]) {
      const items = await this.getItemsForList(list.id);
      result.push({
        id: list.id,
        name: list.name,
        items,
        createdAt: new Date(list.created_at),
        updatedAt: new Date(list.updated_at),
        isTemplate: Boolean(list.is_template),
        isMealPlan: Boolean(list.is_meal_plan),
      });
    }

    return result;
  }

  async getItemsForList(listId: string): Promise<ShoppingItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const items = await this.db.getAllAsync(`
      SELECT id, name, quantity, unit, category, notes, is_completed, created_at, completed_at
      FROM shopping_items 
      WHERE list_id = ?
      ORDER BY created_at ASC
    `, [listId]);

    return (items as any[]).map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      notes: item.notes,
      isCompleted: Boolean(item.is_completed),
      createdAt: new Date(item.created_at),
      completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
    }));
  }

  async getCurrentListId(): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT value FROM app_settings WHERE key = ?',
      ['current_list_id']
    );

    return result.length > 0 ? (result[0] as any).value : null;
  }

  async setCurrentListId(listId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      ['current_list_id', listId]
    );
  }

  async addList(list: ShoppingList): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'INSERT INTO shopping_lists (id, name, created_at, updated_at, is_template, is_meal_plan) VALUES (?, ?, ?, ?, ?, ?)',
      [list.id, list.name, list.createdAt.toISOString(), list.updatedAt.toISOString(), list.isTemplate ? 1 : 0, list.isMealPlan ? 1 : 0]
    );
  }

  async updateList(list: ShoppingList): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE shopping_lists SET name = ?, updated_at = ?, is_template = ?, is_meal_plan = ? WHERE id = ?',
      [list.name, new Date().toISOString(), list.isTemplate ? 1 : 0, list.isMealPlan ? 1 : 0, list.id]
    );
  }

  async deleteList(listId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Items will be deleted automatically due to CASCADE
    await this.db.runAsync('DELETE FROM shopping_lists WHERE id = ?', [listId]);
  }

  async addItemToList(listId: string, item: ShoppingItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`
      INSERT INTO shopping_items 
      (id, list_id, name, quantity, unit, category, notes, is_completed, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      item.id,
      listId,
      item.name,
      item.quantity,
      item.unit,
      item.category,
      item.notes,
      item.isCompleted ? 1 : 0,
      item.createdAt.toISOString(),
      item.completedAt?.toISOString() || null
    ]);

    // Update list's updated_at timestamp
    await this.db.runAsync(
      'UPDATE shopping_lists SET updated_at = ? WHERE id = ?',
      [new Date().toISOString(), listId]
    );
  }

  async updateItemInList(listId: string, item: ShoppingItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`
      UPDATE shopping_items 
      SET name = ?, quantity = ?, unit = ?, category = ?, notes = ?, 
          is_completed = ?, completed_at = ?
      WHERE id = ? AND list_id = ?
    `, [
      item.name,
      item.quantity,
      item.unit,
      item.category,
      item.notes,
      item.isCompleted ? 1 : 0,
      item.completedAt?.toISOString() || null,
      item.id,
      listId
    ]);

    // Update list's updated_at timestamp
    await this.db.runAsync(
      'UPDATE shopping_lists SET updated_at = ? WHERE id = ?',
      [new Date().toISOString(), listId]
    );
  }

  async removeItemFromList(listId: string, itemId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'DELETE FROM shopping_items WHERE id = ? AND list_id = ?',
      [itemId, listId]
    );

    // Update list's updated_at timestamp
    await this.db.runAsync(
      'UPDATE shopping_lists SET updated_at = ? WHERE id = ?',
      [new Date().toISOString(), listId]
    );
  }

  async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');

    const categories = await this.db.getAllAsync(`
      SELECT id, name, icon, is_custom 
      FROM categories 
      ORDER BY is_custom ASC, name ASC
    `);

    return (categories as any[]).map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      isCustom: Boolean(cat.is_custom),
    }));
  }

  async searchItems(query: string, listId?: string): Promise<ShoppingItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    let sql = `
      SELECT DISTINCT id, name, quantity, unit, category, notes, is_completed, created_at, completed_at, list_id
      FROM shopping_items 
      WHERE name LIKE ?
    `;
    
    let params = [`%${query}%`];

    if (listId) {
      sql += ' AND list_id = ?';
      params.push(listId);
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const items = await this.db.getAllAsync(sql, params);

    return (items as any[]).map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      notes: item.notes,
      isCompleted: Boolean(item.is_completed),
      createdAt: new Date(item.created_at),
      completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
    }));
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      DELETE FROM shopping_items;
      DELETE FROM shopping_lists;
      DELETE FROM app_settings;
      DELETE FROM categories;
    `);
    
    await this.seedDefaultData();
  }
}

export const databaseService = new DatabaseService();