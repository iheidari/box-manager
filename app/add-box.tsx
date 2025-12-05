import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Item = {
  id: string;
  name: string;
  imageUri: string | null;
};

export default function AddBoxScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? "light";
  const [boxTitle, setBoxTitle] = useState("");
  const [items, setItems] = useState<Item[]>([
    { id: "1", name: "", imageUri: null },
  ]);

  const handleBack = () => {
    router.back();
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        name: "",
        imageUri: null,
      },
    ]);
  };

  const handleItemNameChange = (id: string, name: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, name } : item)));
  };

  const handleOpenCamera = async (itemId: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Camera permission is required to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setItems(
        items.map((item) =>
          item.id === itemId
            ? { ...item, imageUri: result.assets[0].uri }
            : item
        )
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol
            name="chevron.left"
            size={24}
            color={theme === "light" ? Colors.light.text : Colors.dark.text}
          />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Add New Box
        </ThemedText>
      </ThemedView>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          <ThemedText type="subtitle" style={styles.label}>
            Box Title
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                color: theme === "light" ? Colors.light.text : Colors.dark.text,
                borderColor:
                  theme === "light"
                    ? "rgba(0, 0, 0, 0.2)"
                    : "rgba(255, 255, 255, 0.2)",
                backgroundColor:
                  theme === "light"
                    ? Colors.light.background
                    : Colors.dark.background,
              },
            ]}
            placeholder="Enter box name"
            placeholderTextColor={
              theme === "light" ? Colors.light.icon : Colors.dark.icon
            }
            value={boxTitle}
            onChangeText={setBoxTitle}
            autoFocus
          />

          <ThemedView style={styles.itemsSection}>
            <ThemedView style={styles.itemsHeader}>
              <ThemedText type="subtitle" style={styles.label}>
                Items
              </ThemedText>
              <TouchableOpacity
                onPress={handleAddItem}
                style={styles.addItemButton}
              >
                <IconSymbol
                  name="plus.circle.fill"
                  size={24}
                  color={
                    theme === "light" ? Colors.light.tint : Colors.light.tint
                  }
                />
              </TouchableOpacity>
            </ThemedView>

            {items.map((item) => (
              <ThemedView key={item.id} style={styles.itemRow}>
                <TextInput
                  style={[
                    styles.itemInput,
                    {
                      color:
                        theme === "light"
                          ? Colors.light.text
                          : Colors.dark.text,
                      borderColor:
                        theme === "light"
                          ? "rgba(0, 0, 0, 0.2)"
                          : "rgba(255, 255, 255, 0.2)",
                      backgroundColor:
                        theme === "light"
                          ? Colors.light.background
                          : Colors.dark.background,
                    },
                  ]}
                  placeholder="Item name"
                  placeholderTextColor={
                    theme === "light" ? Colors.light.icon : Colors.dark.icon
                  }
                  value={item.name}
                  onChangeText={(text) => handleItemNameChange(item.id, text)}
                />
                <TouchableOpacity
                  style={[
                    styles.cameraButton,
                    {
                      backgroundColor:
                        theme === "light"
                          ? Colors.light.tint
                          : Colors.light.tint,
                    },
                  ]}
                  onPress={() => handleOpenCamera(item.id)}
                >
                  <IconSymbol name="camera.fill" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  label: {
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 50,
  },
  itemsSection: {
    gap: 12,
  },
  itemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addItemButton: {
    padding: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
