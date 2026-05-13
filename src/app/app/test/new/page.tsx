import { AppHeader } from "@/components/app/AppHeader";
import { NewTestForm } from "@/components/app/NewTestForm";

export default function NewTestPage() {
  return (
    <>
      <AppHeader title="テストを追加" back="/app/test" />
      <NewTestForm />
    </>
  );
}
