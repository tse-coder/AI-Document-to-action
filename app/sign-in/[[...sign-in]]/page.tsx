import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Suspense fallback={<p className="text-sm text-gray-600">Loading sign in…</p>}>
        <SignIn />
      </Suspense>
      <p className="text-sm text-gray-600">
        Just exploring?{" "}
        <Link href="/guest" className="font-semibold text-blue-700 underline">
          Continue as guest
        </Link>
      </p>
    </div>
  );
}
