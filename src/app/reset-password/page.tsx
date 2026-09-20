"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { CircleCheckBig, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { KoaciLogo } from "@/shared/components/KoaciLogo";
import {
  ResetPasswordForm,
  type ResetPasswordFormValues,
} from "@/features/auth/ResetPasswordForm";

import { resetPassword } from "@/features/auth/api";
import { getErrorMessage } from "@/shared/lib/axios";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [succeeded, setSucceeded] = useState(false);

  async function handleResetPassword({ token, password }: ResetPasswordFormValues) {
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSucceeded(true);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal mengatur ulang password."));
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
              Atur Ulang Password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Buat password baru untuk akun Anda.
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {succeeded ? (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <CircleCheckBig className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">
                Password berhasil diubah. Silakan masuk dengan password baru
                Anda.
              </p>
              <Button asChild variant="primary" className="w-full">
                <Link href="/">Masuk</Link>
              </Button>
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <ResetPasswordForm
                loading={loading}
                errorMessage={error}
                onSubmit={handleResetPassword}
              />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
