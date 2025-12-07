import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { deleteImage, saveImagePermanently } from "@/utils/image-storage";
import { Box, Item, storage } from "@/utils/storage";

export default function AddBoxScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? "light";
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!params.id;
  const [boxTitle, setBoxTitle] = useState("");
  const [items, setItems] = useState<Item[]>([
    { id: "1", name: "", imageUri: null },
  ]);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  // Generate a stable ID for new boxes, or use params.id for editing
  // Use ref to persist new box ID across re-renders
  const newBoxIdRef = useRef<string | null>(null);
  const boxId = useMemo(() => {
    if (params.id) {
      return params.id;
    }
    // Generate ID once for new boxes and persist it
    if (!newBoxIdRef.current) {
      newBoxIdRef.current = Date.now().toString();
    }
    return newBoxIdRef.current;
  }, [params.id]);
  const boxTitleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemNameTimeoutsRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());
  // Use refs to track latest values for timeouts
  const boxTitleRef = useRef(boxTitle);
  const itemsRef = useRef(items);
  const itemInputRefs = useRef<Map<string, TextInput>>(new Map());
  const newlyAddedItemIdRef = useRef<string | null>(null);

  // Reset new box ID when switching from editing to creating
  useEffect(() => {
    if (!params.id && newBoxIdRef.current) {
      newBoxIdRef.current = null;
    }
  }, [params.id]);

  // Initialize box data on mount
  useEffect(() => {
    const initializeBox = async () => {
      if (isEditing && params.id) {
        // Load existing box for editing
        const existingBoxes = await storage.getBoxes();
        const boxToEdit = existingBoxes.find((b) => b.id === params.id);
        if (boxToEdit) {
          setBoxTitle(boxToEdit.name);
          boxTitleRef.current = boxToEdit.name;
          // Ensure at least one item exists
          const boxItems =
            boxToEdit.items.length > 0
              ? boxToEdit.items
              : [{ id: Date.now().toString(), name: "", imageUri: null }];
          setItems(boxItems);
          itemsRef.current = boxItems;
        } else {
          // Box not found - show error and redirect back
          Alert.alert(
            "Box Not Found",
            "The box you're trying to edit no longer exists.",
            [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ]
          );
        }
      } else {
        // Initialize default box title for new box
        const existingBoxes = await storage.getBoxes();
        const nextBoxNumber = existingBoxes.length + 1;
        const defaultTitle = `Box ${nextBoxNumber}`;
        setBoxTitle(defaultTitle);
        boxTitleRef.current = defaultTitle;
      }
    };
    initializeBox();
  }, [isEditing, params.id]);

  // Keep refs in sync with state
  useEffect(() => {
    boxTitleRef.current = boxTitle;
  }, [boxTitle]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Auto-focus on newly added item
  useEffect(() => {
    if (newlyAddedItemIdRef.current) {
      const itemId = newlyAddedItemIdRef.current;
      // Use setTimeout to ensure the TextInput is rendered
      setTimeout(() => {
        const inputRef = itemInputRefs.current.get(itemId);
        if (inputRef) {
          inputRef.focus();
        }
        newlyAddedItemIdRef.current = null;
      }, 100);
    }
  }, [items]);

  const saveBox = async (title: string, boxItems: Item[]) => {
    // Only save if box has a title
    if (!title.trim()) {
      return;
    }

    // Filter out empty items but allow box with no items
    const validItems = boxItems.filter((item) => item.name.trim() !== "");

    const box: Box = {
      id: boxId,
      name: title.trim(),
      items: validItems.map((item) => ({
        id: item.id,
        name: item.name.trim(),
        imageUri: item.imageUri,
      })),
    };

    // Check if box already exists, if so update it, otherwise add it
    const existingBoxes = await storage.getBoxes();
    const existingIndex = existingBoxes.findIndex((b) => b.id === boxId);

    if (existingIndex >= 0) {
      existingBoxes[existingIndex] = box;
      await storage.saveBoxes(existingBoxes);
    } else {
      await storage.addBox(box);
    }
  };

  const handleBack = async () => {
    // Clear any pending timeouts
    if (boxTitleTimeoutRef.current) {
      clearTimeout(boxTitleTimeoutRef.current);
      boxTitleTimeoutRef.current = null;
    }
    itemNameTimeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    itemNameTimeoutsRef.current.clear();

    // Save immediately before going back using refs to ensure latest values
    await saveBox(boxTitleRef.current, itemsRef.current);
    router.back();
  };

  const handleAddItem = async () => {
    const newItemId = Date.now().toString();
    const newItems = [
      ...items,
      {
        id: newItemId,
        name: `${items.length + 1}`,
        imageUri: null,
      },
    ];
    setItems(newItems);
    newlyAddedItemIdRef.current = newItemId;
    // Save immediately when item is added
    await saveBox(boxTitle, newItems);
  };

  const handleItemNameChange = (id: string, name: string) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, name } : item
    );
    setItems(updatedItems);
    itemsRef.current = updatedItems;

    // Clear existing timeout for this item
    const existingTimeout = itemNameTimeoutsRef.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout to save after user stops typing (500ms)
    // Use refs to get latest values
    const timeout = setTimeout(() => {
      saveBox(boxTitleRef.current, itemsRef.current);
      itemNameTimeoutsRef.current.delete(id);
    }, 500);

    itemNameTimeoutsRef.current.set(id, timeout);
  };

  const handleBoxTitleChange = (text: string) => {
    setBoxTitle(text);
    boxTitleRef.current = text;

    // Clear existing timeout
    if (boxTitleTimeoutRef.current) {
      clearTimeout(boxTitleTimeoutRef.current);
    }

    // Set new timeout to save after user stops typing (500ms)
    // Use refs to get latest values
    boxTitleTimeoutRef.current = setTimeout(() => {
      saveBox(boxTitleRef.current, itemsRef.current);
    }, 500);
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
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        // Find the current item to delete its old image if it exists
        const currentItem = items.find((item) => item.id === itemId);
        if (currentItem?.imageUri) {
          await deleteImage(currentItem.imageUri);
        }

        // Save image to permanent location
        const permanentUri = await saveImagePermanently(
          result.assets[0].uri,
          itemId
        );

        const updatedItems = items.map((item) =>
          item.id === itemId ? { ...item, imageUri: permanentUri } : item
        );
        setItems(updatedItems);
        // Save immediately when image is added
        await saveBox(boxTitle, updatedItems);
      } catch (error) {
        console.error("Error saving image:", error);
        Alert.alert("Error", "Failed to save image. Please try again.");
      }
    }
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // Find the item to delete its image
          const itemToDelete = items.find((item) => item.id === itemId);
          if (itemToDelete?.imageUri) {
            await deleteImage(itemToDelete.imageUri);
          }

          const updatedItems = items.filter((item) => item.id !== itemId);
          setItems(updatedItems);
          itemsRef.current = updatedItems;
          // Clean up the ref for deleted item
          itemInputRefs.current.delete(itemId);
          // Save immediately when item is deleted
          await saveBox(boxTitle, updatedItems);
        },
      },
    ]);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    const boxTitleTimeout = boxTitleTimeoutRef.current;
    const itemTimeouts = itemNameTimeoutsRef.current;

    return () => {
      if (boxTitleTimeout) {
        clearTimeout(boxTitleTimeout);
      }
      itemTimeouts.forEach((timeout) => clearTimeout(timeout));
      itemTimeouts.clear();
    };
  }, []);

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
          {isEditing ? "Edit Box" : "Add New Box"}
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
            onChangeText={handleBoxTitleChange}
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
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    {
                      backgroundColor:
                        theme === "light"
                          ? "rgba(255, 59, 48, 0.1)"
                          : "rgba(255, 59, 48, 0.2)",
                    },
                  ]}
                  onPress={() => handleDeleteItem(item.id)}
                >
                  <IconSymbol
                    name="xmark"
                    size={16}
                    color={
                      theme === "light"
                        ? "rgba(255, 59, 48, 1)"
                        : "rgba(255, 59, 48, 0.9)"
                    }
                  />
                </TouchableOpacity>
                <TextInput
                  ref={(ref) => {
                    if (ref) {
                      itemInputRefs.current.set(item.id, ref);
                    } else {
                      itemInputRefs.current.delete(item.id);
                    }
                  }}
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
                {item.imageUri && (
                  <TouchableOpacity
                    onPress={() => setSelectedImageUri(item.imageUri)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.imageUri }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
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
      <Modal
        visible={selectedImageUri !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImageUri(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedImageUri(null)}
        >
          <View style={styles.modalImageContainer}>
            {selectedImageUri && (
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedImageUri(null)}
          >
            <IconSymbol name="xmark.circle.fill" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  itemInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
  },
  thumbnailImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImageContainer: {
    width: "90%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: 8,
  },
});
