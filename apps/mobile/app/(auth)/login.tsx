import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

export default function Login() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleLogin() {
    setStatus("Logging in...");

    try {
      const { login } = useAuth();
      const res = await login(username, password);

      if (!res.success) {
        setStatus(res.message);
        return;
      }

      setStatus(`Welcome ${res.user.username}`);
      router.replace("/(app)/(tabs)/home");
    } catch (e: any) {
      setStatus(e.message);
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>Login</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />

      <Button title="Login" onPress={handleLogin} />

      <Text style={{ marginTop: 12 }}>{status}</Text>
    </View>
  );
}
