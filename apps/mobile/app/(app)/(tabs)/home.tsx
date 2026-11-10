import PostCard from "@/components/PostCard";
import { fetchPosts, Post, stripHtml } from "@/lib/posts";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";

export default function Home() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <View style={{ padding: 10, paddingTop: 60 }}>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PostCard
            title={item.title.rendered}
            excerpt={stripHtml(item.excerpt.rendered)}
            image={item._embedded?.["wp:featuredmedia"]?.[0]?.source_url}
            onPress={() =>
              router.push({
                pathname: "/post/[id]",
                params: { id: String(item.id) },
              })
            }
          />
        )}
      ></FlatList>
    </View>
  );
}
