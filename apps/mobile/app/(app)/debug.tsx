import { debugScreenEnabled } from "@/lib/dev";
import { checkHealth } from "@/lib/health";
import { errorMessage } from "@/lib/api";
import { theme } from "@/lib/theme";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function DebugScreen() {
  const [output, setOutput] = useState("Idle");

  if (!debugScreenEnabled) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  async function runHealthCheck() {
    setOutput("Checking…");
    try {
      const result = await checkHealth();
      setOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput(errorMessage(error, "Health check failed."));
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Debug</Text>
      <Pressable
        style={styles.button}
        onPress={() => {
          void runHealthCheck();
        }}
      >
        <Text style={styles.buttonLabel}>Check /health</Text>
      </Pressable>
      <Text style={styles.output}>{output}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: theme.space.lg,
    backgroundColor: theme.color.background,
    gap: theme.space.sm,
  },
  title: {
    fontSize: theme.font.title,
    fontWeight: "700",
    color: theme.color.text,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: theme.color.primary,
    borderRadius: theme.radius,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
  },
  buttonLabel: {
    color: theme.color.onPrimary,
    fontSize: theme.font.small,
    fontWeight: "600",
  },
  output: {
    marginTop: theme.space.sm,
    fontFamily: "monospace",
    fontSize: theme.font.small,
    lineHeight: 20,
    color: theme.color.text,
  },
});
