import { PADDING, PADDING_VERTICAL } from "@/lib/theme";
import { Text, View } from "react-native";

export default function About() {
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: PADDING_VERTICAL,
        paddingHorizontal: PADDING,
      }}
    >
      {" "}
      <Text style={{ fontSize: 22, fontWeight: "700" }}>About</Text>
      <Text>
        WP Mobile Client — a React Native app that connects to Balkan Game Hub
        via a custom WordPress API.
      </Text>
    </View>
  );
}
