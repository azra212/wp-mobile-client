import { theme } from "@/lib/theme";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export function LoadingState() {
  return (
    <View style={styles.fill}>
      <ActivityIndicator color={theme.color.primary} />
    </View>
  );
}

type MessageStateProps = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function MessageState({ title, body, actionLabel, onAction }: MessageStateProps) {
  return (
    <View style={styles.fill}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.action} onPress={onAction}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.space.lg,
    backgroundColor: theme.color.background,
    gap: theme.space.sm,
  },
  title: {
    fontSize: theme.font.title,
    fontWeight: "700",
    color: theme.color.text,
    textAlign: "center",
  },
  body: {
    fontSize: theme.font.body,
    lineHeight: 22,
    color: theme.color.muted,
    textAlign: "center",
  },
  action: {
    marginTop: theme.space.sm,
    backgroundColor: theme.color.primary,
    borderRadius: theme.radius,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
  },
  actionLabel: {
    color: theme.color.onPrimary,
    fontSize: theme.font.small,
    fontWeight: "600",
  },
});
