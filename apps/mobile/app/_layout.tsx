import { AuthProvider } from "@/lib/auth-context";
import { theme } from "@/lib/theme";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.color.background },
        }}
      />
    </AuthProvider>
  );
}
