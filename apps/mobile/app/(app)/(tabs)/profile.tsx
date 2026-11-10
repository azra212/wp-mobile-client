import { useAuth } from "@/lib/auth-context";
import { PADDING, PADDING_VERTICAL } from "@/lib/theme";
import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        paddingVertical: PADDING_VERTICAL,
        paddingHorizontal: PADDING,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Profile</Text>
      <Text>Username: {user?.username}</Text>
      <Text>Email: {user?.email}</Text>

      <Button
        title="Logout"
        onPress={async () => {
          await logout();
          router.replace("/(auth)/login");
        }}
      />
    </View>
  );
}
