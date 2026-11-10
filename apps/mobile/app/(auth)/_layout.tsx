import { LoadingState } from "@/components/screen-state";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  if (user) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        title: "Sign in",
        headerStyle: { backgroundColor: theme.color.surface },
        headerTintColor: theme.color.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.color.background },
      }}
    />
  );
}
