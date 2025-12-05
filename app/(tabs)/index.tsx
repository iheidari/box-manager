import { FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Item = {
  id: string;
  name: string;
};

type Box = {
  id: string;
  name: string;
  items: Item[];
};

// Sample data - replace with your actual data source
const sampleBoxes: Box[] = [
  {
    id: "1",
    name: "Kitchen Supplies",
    items: [
      { id: "1-1", name: "Plates" },
      { id: "1-2", name: "Cups" },
      { id: "1-3", name: "Utensils" },
    ],
  },
  {
    id: "2",
    name: "Electronics",
    items: [
      { id: "2-1", name: "Laptop" },
      { id: "2-2", name: "Chargers" },
      { id: "2-3", name: "Headphones" },
    ],
  },
  {
    id: "3",
    name: "Books",
    items: [
      { id: "3-1", name: "Novels" },
      { id: "3-2", name: "Textbooks" },
    ],
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? "light";
  const borderColor =
    theme === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">My Boxes</ThemedText>
      </ThemedView>
      <FlatList
        data={sampleBoxes}
        renderItem={renderBox}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
});
