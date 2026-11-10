import { ApiError, api } from "./api";

export type Post = {
  id: number;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  featuredMedia: number;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
    }>;
  };
};

export async function fetchPosts(): Promise<Post[]> {
  const posts = await api.request<unknown>("/wp/v2/posts?_embed");
  if (!Array.isArray(posts)) {
    throw new ApiError("Invalid posts response", 200, "invalid_response");
  }
  return posts as Post[];
}

export function fetchPost(id: number): Promise<Post> {
  return api.request<Post>(`/wp/v2/posts/${id}?_embed`);
}

export function featuredImage(post: Post): string | undefined {
  return post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
}
