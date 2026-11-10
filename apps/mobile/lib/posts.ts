import { apiGet } from "./api";

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

export function fetchPosts() {
  return apiGet<Post[]>("/wp/v2/posts?_embed");
}
export function fetchPost(id: number) {
  return apiGet<Post>(`/wp/v2/posts/${id}?_embed`);
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}
