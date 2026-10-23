import { LockKeyhole } from "lucide-react";
import { SignInButton } from "@/components/sign-in-button";

export function SignInGate({ what }: { what: string }) {
  return (
    <div className="glass-strong mx-auto mt-6 flex w-full max-w-md flex-col items-center gap-4 rounded-[28px] p-8 text-center">
      <LockKeyhole className="size-6 text-ink-soft" />
      <div>
        <p className="text-lg font-semibold">Sign in to see your {what}</p>
        <p className="mt-1 text-sm text-ink-soft">Only you can see it.</p>
      </div>
      <SignInButton />
    </div>
  );
}
