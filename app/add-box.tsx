import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function AddBoxScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? "light";
  const [boxTitle, setBoxTitle] = useState("");

  const handleBack = () => {
    router.back();
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
                theme === "light" ? Colors.light.background : Colors.dark.background,
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
      </ThemedView>
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
  content: {
    padding: 20,
    gap: 12,
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
});

