import { connection } from "next/server";
import { Suspense } from "react";
import { ProfileForm } from "@/components/profile-form";
import { SignInGate } from "@/components/sign-in-gate";
import { getConfig } from "@/lib/data";
import { currentUser, getProfile } from "@/lib/me";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="glass h-96 animate-pulse rounded-[22px]" />}>
      <Profile />
    </Suspense>
  );
}

async function Profile() {
  await connection();
  const { userId } = await currentUser();
  if (!userId) return <SignInGate what="profile" />;
  const [profile, config] = await Promise.all([getProfile(), getConfig()]);
  return (
    <div className="mx-auto w-full max-w-3xl">
      <ProfileForm profile={profile} defaultHours={config.default_required_hours} />
    </div>
  );
}
