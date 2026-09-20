"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ForgotPasswordFormProps {
  loading?: boolean;
  errorMessage?: string;
  onSubmit?: (values: ForgotPasswordFormValues) => void;
}

export function ForgotPasswordForm({
  loading,
  errorMessage,
  onSubmit,
}: Readonly<ForgotPasswordFormProps>) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ email });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
          </>
        ) : (
          "Kirim Link Reset"
        )}
      </Button>
    </form>
  );
}
