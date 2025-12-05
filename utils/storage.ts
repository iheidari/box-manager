import AsyncStorage from "@react-native-async-storage/async-storage";

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
      return jsonValue != null ? JSON.parse(jsonValue) : [];
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

