import { checkHealth } from "@/lib/health";
import { useState } from "react";
import { Button, Text, View } from "react-native";

export default function DebugScreen() {
  const [output, setOutput] = useState("Idle");

  async function runHealthCheck() {
    setOutput("Testing...");
    try {
      const res = await checkHealth();
      setOutput(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontWeight: "bold", marginBottom: 12 }}>Debug Tools</Text>

      <Button title="Test /health endpoint" onPress={runHealthCheck} />

      <Text
        style={{
          marginTop: 16,
          fontFamily: "monospace",
        }}
      >
        {output}
      </Text>
    </View>
  );
}
