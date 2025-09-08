import FirstTimeSetup from "@/components/first-time-setup";
import { DatabaseErrorBoundary } from "@/components/database-error-boundary";

export default function SetupPage() {
  // Always show setup page - no server-side database checks to avoid errors
  // The client-side will handle database connection and setup completion checks
  return (
    <DatabaseErrorBoundary showOnSetupPage={true}>
      <FirstTimeSetup />
    </DatabaseErrorBoundary>
  );
}
