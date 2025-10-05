import * as FileSystem from "expo-file-system/legacy";
import { SQLiteStorageService } from "./sqliteStorage";
import { databaseService } from "./database";
import { BackupPayload, BackupListData, BackupItemData } from "../types/Backup";

export interface BackupSummary {
  listCount: number;
  itemCount: number;
}

export interface BackupResult extends BackupSummary {
  fileUri: string;
  fileName: string;
}

const BACKUP_VERSION = 1;

const buildFileName = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `scancart-backup-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
};

const getWritableDirectory = () => {
  return FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
};

const serializeLists = (lists: Awaited<ReturnType<typeof SQLiteStorageService.getLists>>): BackupListData[] => {
  return lists.map(list => ({
    id: list.id,
    name: list.name,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
    isTemplate: list.isTemplate,
    isMealPlan: list.isMealPlan,
    items: list.items.map<BackupItemData>(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity ?? null,
      unit: item.unit ?? null,
      category: item.category,
      notes: item.notes ?? null,
      isCompleted: item.isCompleted,
      createdAt: item.createdAt.toISOString(),
      completedAt: item.completedAt ? item.completedAt.toISOString() : null,
    })),
  }));
};

export const createBackup = async (): Promise<BackupResult> => {
  await SQLiteStorageService.init();
  const lists = await SQLiteStorageService.getLists();
  const currentListId = await SQLiteStorageService.getCurrentListId();

  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    currentListId,
    lists: serializeLists(lists),
  };

  const directory = getWritableDirectory();
  if (!directory) {
    throw new Error("No writable directory available on this device.");
  }

  const fileName = buildFileName();
  const fileUri = `${directory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const itemCount = payload.lists.reduce((total, list) => total + list.items.length, 0);

  return {
    fileUri,
    fileName,
    listCount: payload.lists.length,
    itemCount,
  };
};

const parseBackupPayload = (raw: string): BackupPayload => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("The selected file has an unrecognized format.");
  }

  const payload = parsed as Partial<BackupPayload>;

  if (payload.version !== BACKUP_VERSION) {
    throw new Error("This backup was created with an incompatible app version.");
  }

  if (!Array.isArray(payload.lists)) {
    throw new Error("Backup file is missing list data.");
  }

  return payload as BackupPayload;
};

export const restoreBackupFromUri = async (uri: string): Promise<BackupSummary> => {
  await SQLiteStorageService.init();

  const raw = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const payload = parseBackupPayload(raw);
  await databaseService.replaceAllData(payload);

  const itemCount = payload.lists.reduce((total, list) => total + list.items.length, 0);

  return {
    listCount: payload.lists.length,
    itemCount,
  };
};
