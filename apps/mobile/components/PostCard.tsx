import { theme } from "@/lib/theme";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type PostCardProps = {
  title: string;
  excerpt: string;
  image?: string;
  onPress: () => void;
};

export default function PostCard({ title, excerpt, image, onPress }: PostCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      ) : null}
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.excerpt} numberOfLines={3}>
          {excerpt}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.color.border,
    marginBottom: theme.space.sm,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.85,
  },
  image: {
    width: "100%",
    height: 180,
    backgroundColor: theme.color.border,
  },
  copy: {
    padding: theme.space.md,
    gap: theme.space.xs,
  },
  title: {
    fontSize: theme.font.body,
    fontWeight: "600",
    color: theme.color.text,
  },
  excerpt: {
    fontSize: theme.font.small,
    lineHeight: 20,
    color: theme.color.muted,
  },
});
