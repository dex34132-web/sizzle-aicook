import { createFileRoute } from "@tanstack/react-router";

import ClientApp from "@/cookbuddy-app";

export const Route = createFileRoute("/")({
  component: ClientApp,
  ssr: false,
});
