"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { KoaciLogo } from "@/shared/components/KoaciLogo";
import { LoginForm, type LoginFormValues } from "@/features/auth/LoginForm";
import api from "@/shared/lib/axios";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin({ email, password }: LoginFormValues) {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });

      const { accessToken, refreshToken } = data.data.tokens;

      document.cookie = `access_token=${accessToken}; path=/; max-age=86400`;
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);

      router.push("/admin/dashboard");
    } catch {
      setError("Email atau password salah.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-12">
      
      {/* Card langsung diletakkan di dalam main */}
      <Card className="w-full max-w-[400px] shadow-elevated">
        <CardHeader className="space-y-4 pb-2 text-center">
          <KoaciLogo size="md" showText className="justify-center" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Koaci Admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">Masuk ke Reporting Console</p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <LoginForm variant="admin" loading={loading} errorMessage={error} onSubmit={handleLogin} />
        </CardContent>
      </Card>

    </main>
  );
}