"use client";

import { KeyRound, UserRound } from "lucide-react";

import { ClientGuard } from "@/shared/components/ClientGuard";
import { PageSkeleton } from "@/shared/components/ui/feedback";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

import { ChangePasswordForm } from "@/features/settings/ChangePasswordForm";
import { ProfileForm } from "@/features/settings/ProfileForm";

// Pengaturan akun sendiri — tersedia untuk semua user yang login
export default function AdminSettingsRoute() {
  return (
    <ClientGuard fallback={<PageSkeleton />}>
      <SettingsPage />
    </ClientGuard>
  );
}

function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Pengaturan Akun
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola profil dan keamanan akun Anda.
        </p>
      </header>

      <Tabs defaultValue="profil">
        <TabsList>
          <TabsTrigger value="profil" className="gap-1.5">
            <UserRound className="h-4 w-4" /> Profil
          </TabsTrigger>
          <TabsTrigger value="keamanan" className="gap-1.5">
            <KeyRound className="h-4 w-4" /> Ganti Password
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profil" className="mt-4">
          <ProfileForm />
        </TabsContent>
        <TabsContent value="keamanan" className="mt-4">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
