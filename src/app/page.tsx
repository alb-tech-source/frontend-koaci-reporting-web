"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { KoaciLogo } from "@/shared/components/KoaciLogo";
import { LoginForm, type LoginFormValues } from "@/features/auth/LoginForm";

import { login, fetchCurrentUser } from "@/features/auth/api"; 
import { useAuthStore } from "@/shared/store/authStore";
import { getErrorMessage } from "@/shared/lib/axios"; 

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin({ email, password }: LoginFormValues) {
    setError("");
    setLoading(true);
    try {
      // 1. Panggil API Login (Hanya agar backend menset HttpOnly Cookie)
      await login({ email, password });

      // 2. Panggil API /auth/me (Browser otomatis membawa Cookie dari langkah 1)
      const profileResponse = await fetchCurrentUser();

      // 3. Simpan identitas UI ke Zustand
      if (profileResponse?.success && profileResponse.data) {
        setAuth(profileResponse.data); 
        
        // 4. Redirect ke dashboard admin
        router.push("/admin/dashboard");
      } else {
        setError("Gagal memuat profil pengguna dari server.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Email atau password salah."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-[400px] shadow-elevated">
        <CardHeader className="space-y-4 pb-2 text-center">
          <KoaciLogo size="md" showText className="justify-center" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Koaci Admin
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Masuk ke Reporting Console
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <LoginForm
            variant="admin"
            loading={loading}
            errorMessage={error}
            onSubmit={handleLogin}
          />
        </CardContent>
      </Card>
    </main>
  );
}