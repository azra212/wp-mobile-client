import React from "react";
import { Image, Pressable, Text, View } from "react-native";

type PostCardProps = {
  title: string;
  excerpt: string;
  image?: string;
  onPress: () => void;
};

const PostCard = ({ title, excerpt, image, onPress }: PostCardProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: "#fff",
          padding: 16,
          borderRadius: 8,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#eee",
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={{ gap: 10 }}>
        {image && (
          <Image
            source={{ uri: image }}
            style={{ width: "100%", height: 180 }}
            resizeMode="cover"
          />
        )}
        <View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 6,
              color: "#111",
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: "#555",
            }}
            numberOfLines={3}
          >
            {excerpt}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default PostCard;
