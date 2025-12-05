import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Box, storage } from "@/utils/storage";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? "light";
  const [boxes, setBoxes] = useState<Box[]>([]);
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

  const renderBox = ({ item: box }: { item: Box }) => (
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
      </ThemedView>
      <ThemedView style={styles.itemsContainer}>
        {box.items.map((item) => (
          <ThemedView key={item.id} style={styles.itemRow}>
            <IconSymbol
              name="circle.fill"
              size={8}
              color={theme === "light" ? Colors.light.icon : Colors.dark.icon}
            />
            <ThemedText style={styles.itemName}>{item.name}</ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );

  const handleAddBox = () => {
    router.push("/add-box");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">My Boxes</ThemedText>
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
    paddingTop: 0,
    gap: 16,
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
  itemsContainer: {
    gap: 8,
    marginLeft: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 15,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
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
});
