import { LoadingState, MessageState } from "@/components/screen-state";
import { errorMessage } from "@/lib/api";
import { featuredImage, fetchPost, type Post } from "@/lib/posts";
import { theme } from "@/lib/theme";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { RenderHTML } from "react-native-render-html";

export default function PostDetail() {
  const contentWidth = useWindowDimensions().width;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const numericId = Number(id);
  const idIsValid = Number.isInteger(numericId) && numericId > 0;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(idIsValid);
  const [error, setError] = useState<string | null>(idIsValid ? null : "This post link is invalid.");

  const load = useCallback(() => {
    if (!idIsValid) {
      setLoading(false);
      setError("This post link is invalid.");
      return;
    }

    setLoading(true);
    setError(null);
    fetchPost(numericId)
      .then((next) => {
        setPost(next);
      })
      .catch((caught: unknown) => {
        setPost(null);
        setError(errorMessage(caught, "Couldn't load this post."));
      })
      .finally(() => setLoading(false));
  }, [idIsValid, numericId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !post) {
    return (
      <MessageState
        title={error ? "Couldn't load this post" : "Post not found"}
        body={error ?? "The post is no longer available."}
        actionLabel={idIsValid ? "Try again" : undefined}
        onAction={idIsValid ? load : undefined}
      />
    );
  }

  const image = featuredImage(post);

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {image ? <Image source={{ uri: image }} style={styles.image} resizeMode="cover" /> : null}
        <Text style={styles.title}>{post.title.rendered}</Text>
        <RenderHTML
          contentWidth={contentWidth - theme.space.md * 2}
          source={{ html: post.content.rendered }}
          ignoredDomTags={["iframe"]}
          tagsStyles={{
            p: {
              fontSize: theme.font.body,
              lineHeight: 24,
              marginBottom: theme.space.sm,
              color: theme.color.muted,
            },
            img: { marginVertical: theme.space.md },
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.background,
  },
  content: {
    paddingHorizontal: theme.space.md,
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.lg,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: theme.radius,
    marginBottom: theme.space.md,
    backgroundColor: theme.color.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: theme.space.md,
    color: theme.color.text,
  },
});
