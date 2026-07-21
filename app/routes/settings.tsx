import { TbuPage } from "~/components/tbu-page";

export function meta() {
  return [{ title: "Settings | MAROSA" }];
}

export default function SettingsPage() {
  return <TbuPage titleKey="settings" />;
}
