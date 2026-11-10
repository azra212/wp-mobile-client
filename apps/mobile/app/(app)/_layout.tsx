import { LoadingState } from "@/components/screen-state";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";
import { Redirect, Stack } from "expo-router";

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.color.surface },
        headerTintColor: theme.color.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.color.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="post/[id]" options={{ title: "Post" }} />
      <Stack.Screen name="debug" options={{ headerShown: false }} />
    </Stack>
  );
}
