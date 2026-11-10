import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !submitting;

  async function handleLogin() {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await login(username.trim(), password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    router.replace("/(app)/(tabs)/home");
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.lead}>Use your WordPress username and password.</Text>

      <TextInput
        placeholder="Username"
        placeholderTextColor={theme.color.muted}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor={theme.color.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, !canSubmit ? styles.buttonDisabled : null]}
        onPress={() => {
          void handleLogin();
        }}
        disabled={!canSubmit}
      >
        <Text style={styles.buttonLabel}>{submitting ? "Signing in…" : "Sign in"}</Text>
      </Pressable>
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
  lead: {
    fontSize: theme.font.body,
    lineHeight: 22,
    color: theme.color.muted,
    marginBottom: theme.space.sm,
  },
  input: {
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.sm,
    fontSize: theme.font.body,
    color: theme.color.text,
  },
  error: {
    color: theme.color.danger,
    fontSize: theme.font.small,
    lineHeight: 20,
  },
  button: {
    marginTop: theme.space.sm,
    backgroundColor: theme.color.primary,
    borderRadius: theme.radius,
    paddingVertical: theme.space.sm,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    color: theme.color.onPrimary,
    fontSize: theme.font.body,
    fontWeight: "600",
  },
});
