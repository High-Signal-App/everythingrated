import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EverythingRated",
    short_name: "EverythingRated",
    description: "Multi-axis ratings for everything.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [],
  };
}
