import { LoadingState } from "@/components/screen-state";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return <LoadingState />;
  }

  const roles = user.roles.length > 0 ? user.roles.join(", ") : "None";

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <Text style={styles.value}>{user.username}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user.email}</Text>
        <Text style={styles.label}>Roles</Text>
        <Text style={styles.value}>{roles}</Text>
      </View>
      <Pressable
        style={styles.button}
        onPress={() => {
          void logout().then(() => router.replace("/(auth)/login"));
        }}
      >
        <Text style={styles.buttonLabel}>Log out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.background,
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.md,
    gap: theme.space.md,
  },
  title: {
    fontSize: theme.font.title,
    fontWeight: "700",
    color: theme.color.text,
  },
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.color.border,
    padding: theme.space.md,
    gap: theme.space.xs,
  },
  label: {
    marginTop: theme.space.xs,
    fontSize: theme.font.small,
    color: theme.color.muted,
  },
  value: {
    fontSize: theme.font.body,
    color: theme.color.text,
  },
  button: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
  },
  buttonLabel: {
    fontSize: theme.font.body,
    fontWeight: "600",
    color: theme.color.text,
  },
});
