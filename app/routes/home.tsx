import type { Route } from "./+types/home";
import { TbuPage } from "~/components/tbu-page";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home | MAROSA" },
    { name: "description", content: "MAROSA coffee roasting management" },
  ];
}

export default function Home() {
  return <TbuPage title="Home" />;
}
