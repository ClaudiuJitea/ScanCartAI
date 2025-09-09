import { create } from 'zustand';
import { ShoppingList, ShoppingItem } from '../types/ShoppingList';
import { SQLiteStorageService } from '../services/sqliteStorage';

interface ShoppingListState {
  lists: ShoppingList[];
  currentListId: string | null;
  loading: boolean;
  activeList: ShoppingList | null;
  
  // Actions
  initializeStore: () => Promise<void>;
  addList: (name: string, isMealPlan?: boolean) => Promise<string>;
  updateListName: (listId: string, newName: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  setCurrentList: (listId: string) => Promise<void>;
  addItemToCurrentList: (item: Omit<ShoppingItem, 'id' | 'createdAt'>) => Promise<void>;
  addItemToList: (listId: string, item: Omit<ShoppingItem, 'id' | 'createdAt'>) => Promise<void>;
  updateItemInCurrentList: (itemId: string, updates: Partial<ShoppingItem>) => Promise<void>;
  removeItemFromCurrentList: (itemId: string) => Promise<void>;
  toggleItemCompletion: (itemId: string) => Promise<void>;
  searchItems: (query: string) => Promise<ShoppingItem[]>;
  clearStorage: () => Promise<void>;
  getCurrentList: () => ShoppingList | null;
  addItem: (name: string, quantity?: string, category?: string) => Promise<void>;
}

export const useShoppingList = create<ShoppingListState>((set, get) => ({
  lists: [],
  currentListId: null,
  loading: true,
  activeList: null,

  initializeStore: async () => {
    set({ loading: true });
    try {
      await SQLiteStorageService.init();
      const lists = await SQLiteStorageService.getLists();
      const currentListId = await SQLiteStorageService.getCurrentListId();
      
      // If no lists exist, create a default one
      if (lists.length === 0) {
        const defaultList: ShoppingList = {
          id: Date.now().toString(),
          name: 'My Shopping List',
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isTemplate: false,
          isMealPlan: false,
        };
        await SQLiteStorageService.addList(defaultList);
        await SQLiteStorageService.setCurrentListId(defaultList.id);
        set({ lists: [defaultList], currentListId: defaultList.id, activeList: defaultList });
      } else {
        // If no current list is set, use the first list
        const activeListId = currentListId || lists[0].id;
        if (!currentListId) {
          await SQLiteStorageService.setCurrentListId(activeListId);
        }
        const activeList = lists.find(l => l.id === activeListId) || null;
        set({ lists, currentListId: activeListId, activeList });
      }
    } catch (error) {
      console.error('Error initializing store:', error);
    } finally {
      set({ loading: false });
    }
  },

  addList: async (name: string, isMealPlan?: boolean) => {
    const newList: ShoppingList = {
      id: Date.now().toString(),
      name,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isTemplate: false,
      isMealPlan: isMealPlan || false,
    };
    
    try {
      await SQLiteStorageService.addList(newList);
      const updatedLists = [...get().lists, newList];
      set({ lists: updatedLists });
      return newList.id;
    } catch (error) {
      console.error('Error adding list:', error);
      throw error;
    }
  },

  updateListName: async (listId: string, newName: string) => {
    try {
      const { lists, currentListId } = get();
      const updatedLists = lists.map(list => 
        list.id === listId 
          ? { ...list, name: newName, updatedAt: new Date() }
          : list
      );
      
      // Update in database
      const updatedList = updatedLists.find(l => l.id === listId);
      if (updatedList) {
        await SQLiteStorageService.updateList(updatedList);
      }
      
      const activeList = currentListId === listId ? updatedLists.find(l => l.id === listId) || null : get().activeList;
      set({ lists: updatedLists, activeList });
    } catch (error) {
      console.error('Error updating list name:', error);
    }
  },

  deleteList: async (listId: string) => {
    try {
      await SQLiteStorageService.deleteList(listId);
      const { lists, currentListId } = get();
      const updatedLists = lists.filter(list => list.id !== listId);
      
      let newCurrentListId = currentListId;
      if (currentListId === listId) {
        newCurrentListId = updatedLists.length > 0 ? updatedLists[0].id : null;
        if (newCurrentListId) {
          await SQLiteStorageService.setCurrentListId(newCurrentListId);
        }
      }
      
      const activeList = newCurrentListId ? updatedLists.find(l => l.id === newCurrentListId) || null : null;
      set({ lists: updatedLists, currentListId: newCurrentListId, activeList });
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  },

  setCurrentList: async (listId: string) => {
    try {
      await SQLiteStorageService.setCurrentListId(listId);
      const { lists } = get();
      const activeList = lists.find(l => l.id === listId) || null;
      set({ currentListId: listId, activeList });
    } catch (error) {
      console.error('Error setting current list:', error);
    }
  },

  addItemToCurrentList: async (itemData) => {
    const { currentListId, lists } = get();
    if (!currentListId) return;
    
    const newItem: ShoppingItem = {
      ...itemData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    try {
      await SQLiteStorageService.addItemToList(currentListId, newItem);
      const updatedLists = lists.map(list => 
        list.id === currentListId 
          ? { ...list, items: [...list.items, newItem], updatedAt: new Date() }
          : list
      );
      const activeList = updatedLists.find(l => l.id === currentListId) || null;
      set({ lists: updatedLists, activeList });
    } catch (error) {
      console.error('Error adding item:', error);
    }
  },

  addItemToList: async (listId: string, itemData) => {
    const { lists } = get();
    
    const newItem: ShoppingItem = {
      ...itemData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    
    try {
      await SQLiteStorageService.addItemToList(listId, newItem);
      const updatedLists = lists.map(list => 
        list.id === listId 
          ? { ...list, items: [...list.items, newItem], updatedAt: new Date() }
          : list
      );
      const activeList = get().currentListId === listId ? updatedLists.find(l => l.id === listId) || null : get().activeList;
      set({ lists: updatedLists, activeList });
    } catch (error) {
      console.error('Error adding item to list:', error);
      throw error;
    }
  },

  updateItemInCurrentList: async (itemId, updates) => {
    const { currentListId, lists } = get();
    if (!currentListId) return;
    
    try {
      const list = lists.find(l => l.id === currentListId);
      if (!list) return;
      
      const item = list.items.find(i => i.id === itemId);
      if (!item) return;
      
      const updatedItem = { ...item, ...updates };
      await SQLiteStorageService.updateItemInList(currentListId, updatedItem);
      
      const updatedLists = lists.map(l => 
        l.id === currentListId 
          ? { 
              ...l, 
              items: l.items.map(i => i.id === itemId ? updatedItem : i),
              updatedAt: new Date()
            }
          : l
      );
      const activeList = updatedLists.find(l => l.id === currentListId) || null;
      set({ lists: updatedLists, activeList });
    } catch (error) {
      console.error('Error updating item:', error);
    }
  },

  removeItemFromCurrentList: async (itemId) => {
    const { currentListId, lists } = get();
    if (!currentListId) return;
    
    try {
      await SQLiteStorageService.removeItemFromList(currentListId, itemId);
      const updatedLists = lists.map(list => 
        list.id === currentListId 
          ? { 
              ...list, 
              items: list.items.filter(item => item.id !== itemId),
              updatedAt: new Date()
            }
          : list
      );
      const activeList = updatedLists.find(l => l.id === currentListId) || null;
      set({ lists: updatedLists, activeList });
    } catch (error) {
      console.error('Error removing item:', error);
    }
  },

  toggleItemCompletion: async (itemId) => {
    const { currentListId, lists } = get();
    if (!currentListId) return;
    
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;
    
    const item = list.items.find(i => i.id === itemId);
    if (!item) return;
    
    const updates = {
      isCompleted: !item.isCompleted,
      completedAt: !item.isCompleted ? new Date() : undefined,
    };
    
    await get().updateItemInCurrentList(itemId, updates);
  },

  searchItems: async (query: string) => {
    const { currentListId } = get();
    try {
      return await SQLiteStorageService.searchItems(query, currentListId || undefined);
    } catch (error) {
      console.error('Error searching items:', error);
      return [];
    }
  },

  clearStorage: async () => {
    try {
      await SQLiteStorageService.clearStorage();
      set({ lists: [], currentListId: null, activeList: null });
      // Reinitialize with default data
      await get().initializeStore();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },

  getCurrentList: () => {
    const { lists, currentListId } = get();
    return lists.find(list => list.id === currentListId) || null;
  },

  addItem: async (name: string, quantity?: string, category?: string) => {
    await get().addItemToCurrentList({
      name,
      quantity: quantity || '1',
      category: category || 'other',
      isCompleted: false,
      notes: '',
    });
  },
}));