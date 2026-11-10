import PostCard from "@/components/PostCard";
import { LoadingState, MessageState } from "@/components/screen-state";
import { errorMessage } from "@/lib/api";
import { stripHtml } from "@/lib/html";
import { featuredImage, fetchPosts, type Post } from "@/lib/posts";
import { theme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchPosts()
      .then((next) => {
        setPosts(next);
      })
      .catch((caught: unknown) => {
        setPosts([]);
        setError(errorMessage(caught, "Couldn't load posts."));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <MessageState
        title="Couldn't load posts"
        body={error}
        actionLabel="Try again"
        onAction={load}
      />
    );
  }

  if (posts.length === 0) {
    return (
      <MessageState
        title="No posts"
        body="When the site publishes something, it will show up here."
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <PostCard
            title={item.title.rendered}
            excerpt={stripHtml(item.excerpt.rendered)}
            image={featuredImage(item)}
            onPress={() =>
              router.push({
                pathname: "/post/[id]",
                params: { id: String(item.id) },
              })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.background,
  },
  list: {
    paddingHorizontal: theme.space.md,
    paddingTop: theme.space.md,
    paddingBottom: theme.space.lg,
  },
});
