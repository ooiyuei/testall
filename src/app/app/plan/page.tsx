import { AppHeader } from "@/components/app/AppHeader";
import { PlanView } from "@/components/app/PlanView";

export default function PlanPage() {
  return (
    <>
      <AppHeader title="今週の計画" />
      <PlanView />
    </>
  );
}
