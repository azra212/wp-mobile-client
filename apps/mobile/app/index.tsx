import { LoadingState } from "@/components/screen-state";
import { useAuth } from "@/lib/auth-context";
import { Redirect } from "expo-router";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(app)/(tabs)/home" />;
}
