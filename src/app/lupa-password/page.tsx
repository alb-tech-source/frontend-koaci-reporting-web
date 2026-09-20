"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { KoaciLogo } from "@/shared/components/KoaciLogo";
import {
  ForgotPasswordForm,
  type ForgotPasswordFormValues,
} from "@/features/auth/ForgotPasswordForm";

import { forgotPassword } from "@/features/auth/api";
import { getErrorMessage } from "@/shared/lib/axios";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleForgotPassword({ email }: ForgotPasswordFormValues) {
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal mengirim link reset password."));
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
              Lupa Password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Masukkan email Anda dan kami akan mengirimkan link untuk mengatur
              ulang password.
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {submitted ? (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <MailCheck className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">
                Jika email terdaftar, link reset password akan dikirim ke email
                Anda. Periksa kotak masuk Anda (termasuk folder spam).
              </p>
              <Button asChild variant="primary" className="w-full">
                <Link href="/">Kembali ke Halaman Masuk</Link>
              </Button>
            </div>
          ) : (
            <ForgotPasswordForm
              loading={loading}
              errorMessage={error}
              onSubmit={handleForgotPassword}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
