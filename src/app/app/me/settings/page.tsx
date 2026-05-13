import { AppHeader } from "@/components/app/AppHeader";
import { SettingsView } from "@/components/app/SettingsView";

export default function SettingsPage() {
  return (
    <>
      <AppHeader title="設定" back="/app/me" />
      <SettingsView />
    </>
  );
}
