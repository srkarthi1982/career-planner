import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ unreadCount: 0 }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
