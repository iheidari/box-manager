import AsyncStorage from "@react-native-async-storage/async-storage";
import { migrateImageToPermanent } from "./image-storage";

const BOXES_STORAGE_KEY = "@boxes_storage";

export type Item = {
  id: string;
  name: string;
  imageUri: string | null;
};

export type Box = {
  id: string;
  name: string;
  items: Item[];
};

export const storage = {
  async getBoxes(): Promise<Box[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(BOXES_STORAGE_KEY);
      const boxes: Box[] = jsonValue != null ? JSON.parse(jsonValue) : [];

      // Migrate any temporary image URIs to permanent storage
      const migratedBoxes = await Promise.all(
        boxes.map(async (box) => {
          const migratedItems = await Promise.all(
            box.items.map(async (item) => {
              if (item.imageUri) {
                const permanentUri = await migrateImageToPermanent(
                  item.imageUri,
                  item.id
                );
                return { ...item, imageUri: permanentUri };
              }
              return item;
            })
          );
          return { ...box, items: migratedItems };
        })
      );

      // Save migrated boxes if any migrations occurred
      const needsSave = JSON.stringify(boxes) !== JSON.stringify(migratedBoxes);
      if (needsSave) {
        await this.saveBoxes(migratedBoxes);
      }

      return migratedBoxes;
    } catch (e) {
      console.error("Error loading boxes:", e);
      return [];
    }
  },

  async saveBoxes(boxes: Box[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(boxes);
      await AsyncStorage.setItem(BOXES_STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error("Error saving boxes:", e);
    }
  },

  async addBox(box: Box): Promise<void> {
    const boxes = await this.getBoxes();
    boxes.push(box);
    await this.saveBoxes(boxes);
  },
};
