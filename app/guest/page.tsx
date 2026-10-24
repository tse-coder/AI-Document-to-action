import WorkspaceClient from "@/components/workspace/WorkspaceClient";

/** Accountless, sample-data-only demo. API calls are intercepted by the client mock layer. */
export default function GuestPage() {
  return <WorkspaceClient guestMode />;
}
