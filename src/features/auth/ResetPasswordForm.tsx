"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export interface ResetPasswordFormValues {
  token: string;
  password: string;
}

export interface ResetPasswordFormProps {
  loading?: boolean;
  errorMessage?: string;
  onSubmit?: (values: ResetPasswordFormValues) => void;
}

export function ResetPasswordForm({
  loading,
  errorMessage,
  onSubmit,
}: Readonly<ResetPasswordFormProps>) {
  const token = useSearchParams().get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Link tanpa token tidak bisa dipakai — arahkan pengguna minta link baru
  if (!token) {
    return (
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <KeyRound className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          Link reset tidak valid atau sudah kadaluarsa.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/lupa-password">Kirim Ulang Link Reset</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Mirror validasi backend (auth.validation.ts): min 8, huruf besar, angka
    if (password.length < 8) {
      setValidationError("Password minimal 8 karakter");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setValidationError("Password harus mengandung huruf besar");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setValidationError("Password harus mengandung angka");
      return;
    }
    if (password !== confirmPassword) {
      setValidationError("Konfirmasi password tidak sesuai");
      return;
    }

    onSubmit?.({ token, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(validationError || errorMessage) && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {validationError || errorMessage}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="reset-new-password">Password Baru</Label>
        <div className="relative">
          <Input
            id="reset-new-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Minimal 8 karakter, huruf besar, dan angka.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reset-confirm-password">Konfirmasi Password</Label>
        <div className="relative">
          <Input
            id="reset-confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
          </>
        ) : (
          "Simpan Password Baru"
        )}
      </Button>
    </form>
  );
}
