import { NavigatorScreenParams } from '@react-navigation/native';

export type RootTabParamList = {
  MyLists: NavigatorScreenParams<ListsStackParamList>;
  MealPlanner: undefined;
  Settings: undefined;
  ListScanner: { scanMode?: 'list' | 'barcode' };
};

export type ListsStackParamList = {
  ListsScreen: undefined;
  CreateListScreen: undefined;
  HomeScreen: { listId?: string };
};

export type HomeStackParamList = {
  HomeScreen: { listId?: string };
};