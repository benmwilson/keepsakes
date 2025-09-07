import { redirect } from "next/navigation";
import { isFirstTimeSetup } from "@/actions/setup";
import FirstTimeSetup from "@/components/first-time-setup";

export default async function SetupPage() {
  const needsSetup = await isFirstTimeSetup();
  
  if (!needsSetup) {
    // If setup is already complete, redirect to home
    redirect("/");
  }

  return <FirstTimeSetup />;
}
