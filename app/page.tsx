import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import HomeRoutePage from "@/app/home/page";

export default async function RootPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/app");
  }
  return <HomeRoutePage />;
}
