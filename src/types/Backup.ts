export interface BackupItemData {
  id: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  category: string;
  notes?: string | null;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string | null;
}

export interface BackupListData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
  isMealPlan?: boolean;
  items: BackupItemData[];
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  currentListId: string | null;
  lists: BackupListData[];
}
