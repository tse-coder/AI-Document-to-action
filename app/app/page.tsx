import { auth } from "@clerk/nextjs/server";
import WorkspaceClient from "@/components/workspace/WorkspaceClient";

export default async function AppPage() {
  const { userId } = await auth();
  return <WorkspaceClient guestMode={!userId} />;
}
