import { auth } from "@clerk/nextjs/server";
import WorkspaceClient from "@/components/workspace/WorkspaceClient";

export default async function HomePage() {
  await auth.protect();
  return <WorkspaceClient />;
}
