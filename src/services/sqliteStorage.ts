import { ShoppingList, ShoppingItem } from '../types/ShoppingList';
import { databaseService } from './database';

export class SQLiteStorageService {
  static async init(): Promise<void> {
    await databaseService.init();
  }

  static async getLists(): Promise<ShoppingList[]> {
    return await databaseService.getAllLists();
  }

  static async getCurrentListId(): Promise<string | null> {
    return await databaseService.getCurrentListId();
  }

  static async setCurrentListId(listId: string): Promise<void> {
    await databaseService.setCurrentListId(listId);
  }

  static async addList(list: ShoppingList): Promise<void> {
    await databaseService.addList(list);
  }

  static async updateList(updatedList: ShoppingList): Promise<void> {
    await databaseService.updateList(updatedList);
  }

  static async deleteList(listId: string): Promise<void> {
    await databaseService.deleteList(listId);
  }

  static async addItemToList(listId: string, item: ShoppingItem): Promise<void> {
    await databaseService.addItemToList(listId, item);
  }

  static async updateItemInList(listId: string, updatedItem: ShoppingItem): Promise<void> {
    await databaseService.updateItemInList(listId, updatedItem);
  }

  static async removeItemFromList(listId: string, itemId: string): Promise<void> {
    await databaseService.removeItemFromList(listId, itemId);
  }

  static async searchItems(query: string, listId?: string): Promise<ShoppingItem[]> {
    return await databaseService.searchItems(query, listId);
  }

  static async clearStorage(): Promise<void> {
    await databaseService.clearAllData();
  }
}