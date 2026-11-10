import { theme } from "@/lib/theme";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function About() {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <Text style={styles.title}>About</Text>
      <Text style={styles.body}>
        WP Mobile Client reads posts from a WordPress site and signs in through the companion
        plugin. Access tokens are stored on this device and replaced when they expire.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.background,
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.md,
    gap: theme.space.sm,
  },
  title: {
    fontSize: theme.font.title,
    fontWeight: "700",
    color: theme.color.text,
  },
  body: {
    fontSize: theme.font.body,
    lineHeight: 24,
    color: theme.color.muted,
  },
});
