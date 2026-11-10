import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { RenderHTML } from "react-native-render-html";

import { fetchPost, Post } from "@/lib/posts";
import { COLORS, PADDING } from "@/lib/theme";

const styles = StyleSheet.create<{
  centerContainer: ViewStyle;
  contentContainer: ViewStyle;
  scrollContent: ViewStyle;
  featuredImage: ImageStyle;
  title: TextStyle;
  errorHeading: TextStyle;
  errorMessage: TextStyle;
}>({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: PADDING,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: PADDING,
    paddingTop: 10,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  featuredImage: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    color: COLORS.primary,
  },
  errorHeading: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default function PostDetail() {
  const contentWidth = useWindowDimensions().width;

  const { id } = useLocalSearchParams<{ id: string }>();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetchPost(Number(id))
      .then(setPost)
      .catch(() => setError("Failed to load post"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorHeading}>
          {error ? "Failed to Load Post" : "Post Not Found"}
        </Text>
        <Text style={styles.errorMessage}>
          {error ?? "The post you're looking for couldn't be found."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.contentContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {post._embedded?.["wp:featuredmedia"]?.[0]?.source_url && (
          <Image
            source={{
              uri: post._embedded["wp:featuredmedia"][0].source_url,
            }}
            style={styles.featuredImage}
            resizeMode="cover"
          />
        )}

        <Text style={styles.title}>{post.title.rendered}</Text>

        <RenderHTML
          contentWidth={contentWidth - PADDING * 2}
          source={{ html: post.content.rendered }}
          ignoredDomTags={["iframe"]}
          tagsStyles={{
            p: {
              fontSize: 16,
              lineHeight: 24,
              marginBottom: 12,
              color: COLORS.secondary,
            },
            img: { marginVertical: 16 },
          }}
        />
      </ScrollView>
    </View>
  );
}
