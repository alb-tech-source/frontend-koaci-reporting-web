"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface LoginFormProps {
  variant: "admin" | "investor";
  loading?: boolean;
  errorMessage?: string;
  onSubmit?: (values: LoginFormValues) => void;
  forgotPasswordHref?: string; 
}

export function LoginForm({
  variant,
  loading,
  errorMessage,
  onSubmit,
  forgotPasswordHref = "/login/lupa-password", 
}: Readonly<LoginFormProps>) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ email, password });
  };

  const isAdmin = variant === "admin";
  const inputIdPrefix = isAdmin ? "admin" : "investor";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${inputIdPrefix}-email`}>Email</Label>
        <Input
          id={`${inputIdPrefix}-email`}
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${inputIdPrefix}-password`}>Password</Label>
        <Input
          id={`${inputIdPrefix}-password`}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        size={isAdmin ? "default" : "touch"}
        className="w-full"
        disabled={loading}
      >
        {loading ? "Memproses..." : "Masuk"}
      </Button>
      <div className="text-center">
        <Link
          href={forgotPasswordHref}
          className="inline-block text-sm text-muted-foreground transition-colors hover:text-brand"
        >
          Lupa password?
        </Link>
      </div>
    </form>
  );
}