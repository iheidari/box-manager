import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { deleteImage } from "@/utils/image-storage";
import { Box, storage } from "@/utils/storage";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? "light";
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const borderColor =
    theme === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";

  const loadBoxes = useCallback(async () => {
    const loadedBoxes = await storage.getBoxes();
    setBoxes(loadedBoxes);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBoxes();
    }, [loadBoxes])
  );

  const handleBoxPress = (boxId: string) => {
    router.push(`/add-box?id=${boxId}`);
  };

  const handleDeleteBox = (boxId: string, boxName: string) => {
    Alert.alert(
      "Delete Box",
      `Are you sure you want to delete "${boxName}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const boxes = await storage.getBoxes();
            const boxToDelete = boxes.find((box) => box.id === boxId);

            // Delete all images associated with items in this box
            if (boxToDelete) {
              await Promise.all(
                boxToDelete.items.map((item) =>
                  item.imageUri ? deleteImage(item.imageUri) : Promise.resolve()
                )
              );
            }

            const updatedBoxes = boxes.filter((box) => box.id !== boxId);
            await storage.saveBoxes(updatedBoxes);
            setBoxes(updatedBoxes);
          },
        },
      ]
    );
  };

  const renderBox = ({ item: box }: { item: Box }) => (
    <TouchableOpacity
      onPress={() => handleBoxPress(box.id)}
      activeOpacity={0.7}
    >
      <ThemedView style={[styles.boxContainer, { borderColor }]}>
        <ThemedView style={styles.boxHeader}>
          <IconSymbol
            name="cube.box"
            size={24}
            color={theme === "light" ? Colors.light.tint : Colors.dark.tint}
          />
          <ThemedText type="subtitle" style={styles.boxName}>
            {box.name}
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.deleteBoxButton,
              {
                backgroundColor:
                  theme === "light"
                    ? "rgba(255, 59, 48, 0.1)"
                    : "rgba(255, 59, 48, 0.2)",
              },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteBox(box.id, box.name);
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol
              name="trash.fill"
              size={16}
              color={
                theme === "light"
                  ? "rgba(255, 59, 48, 1)"
                  : "rgba(255, 59, 48, 0.9)"
              }
            />
          </TouchableOpacity>
        </ThemedView>
        <ThemedView style={styles.itemsContainer}>
          {box.items.map((item) => (
            <ThemedView
              key={item.id}
              style={[
                styles.itemCard,
                {
                  backgroundColor:
                    theme === "light"
                      ? "rgba(0, 0, 0, 0.03)"
                      : "rgba(255, 255, 255, 0.3)",
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  if (item.imageUri) {
                    setSelectedImageUri(item.imageUri);
                  }
                }}
                activeOpacity={0.8}
                disabled={!item.imageUri}
              >
                <Image
                  source={
                    item.imageUri
                      ? { uri: item.imageUri }
                      : require("@/assets/images/default-item.png")
                  }
                  style={styles.itemImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <ThemedText style={styles.itemName} numberOfLines={2}>
                {item.name}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );

  const handleAddBox = () => {
    router.push("/add-box");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Boxes</ThemedText>
      </ThemedView>
      <FlatList
        data={boxes}
        renderItem={renderBox}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              No boxes yet. Tap the + button to create one!
            </ThemedText>
          </ThemedView>
        }
      />
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor:
              theme === "light" ? Colors.light.tint : Colors.light.tint,
          },
        ]}
        onPress={handleAddBox}
        activeOpacity={0.8}
      >
        <IconSymbol name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 16,
  },
  listContent: {
    padding: 20,
    paddingTop: 16,
    gap: 8,
  },
  boxContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  boxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  boxName: {
    flex: 1,
  },
  deleteBoxButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  itemsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginLeft: 4,
  },
  itemCard: {
    width: 80,
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "white",
  },
  itemName: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 32,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
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
