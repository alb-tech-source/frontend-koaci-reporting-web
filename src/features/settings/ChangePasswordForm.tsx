import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { getErrorMessage } from "@/shared/lib/axios";
import { cn } from "@/shared/lib/utils";

import { changePassword } from "./api";
import { isStrongPassword, passwordRules } from "./utils";

const emptyValues = { current: "", next: "", confirm: "" };

export function ChangePasswordForm() {
  const [values, setValues] = useState(emptyValues);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (key: keyof typeof emptyValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === "current") setCurrentError(null);
    setFormError(null);
  };

  const sameAsCurrent = values.next !== "" && values.next === values.current;
  const confirmMismatch =
    values.confirm !== "" && values.confirm !== values.next;
  const canSubmit =
    values.current !== "" &&
    isStrongPassword(values.next) &&
    !sameAsCurrent &&
    values.confirm === values.next;

  const mutation = useMutation({
    mutationFn: () =>
      changePassword({
        currentPassword: values.current,
        newPassword: values.next,
      }),
    onSuccess: () => {
      toast.success("Password berhasil diganti.");
      setValues(emptyValues);
    },
    onError: (err: unknown) => {
      const message = getErrorMessage(err, "Gagal mengganti password.");
      // Backend sengaja memakai 400 (bukan 401) untuk password lama yang salah
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 400 &&
        /password saat ini/i.test(message)
      ) {
        setCurrentError(message);
        return;
      }
      setFormError(message);
    },
  });

  return (
    <section className="rounded-2xl border border-border bg-background shadow-card">
      <div className="border-b border-border p-5">
        <h2 className="text-base font-semibold text-foreground">
          Ganti Password
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Masukkan password saat ini untuk konfirmasi, lalu buat password baru.
          Anda tetap login di perangkat ini setelah password diganti.
        </p>
      </div>

      <form
        className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_16rem]"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit && !mutation.isPending) mutation.mutate();
        }}
      >
        <div className="space-y-4">
          <PasswordField
            id="currentPassword"
            label="Password Saat Ini *"
            autoComplete="current-password"
            value={values.current}
            onChange={(v) => set("current", v)}
            error={currentError ?? undefined}
          />
          <PasswordField
            id="newPassword"
            label="Password Baru *"
            autoComplete="new-password"
            value={values.next}
            onChange={(v) => set("next", v)}
            error={
              sameAsCurrent
                ? "Password baru harus berbeda dari password saat ini."
                : undefined
            }
          />
          <PasswordField
            id="confirmPassword"
            label="Konfirmasi Password Baru *"
            autoComplete="new-password"
            value={values.confirm}
            onChange={(v) => set("confirm", v)}
            error={confirmMismatch ? "Konfirmasi password tidak cocok." : undefined}
          />

          {formError ? (
            <p
              className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
              role="alert"
            >
              {formError}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl bg-muted/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Syarat password baru
          </p>
          <ul className="space-y-1.5 text-sm">
            {passwordRules.map((rule) => (
              <RuleItem
                key={rule.label}
                label={rule.label}
                passed={rule.test(values.next)}
              />
            ))}
            <RuleItem
              label="Berbeda dari password saat ini"
              passed={values.next !== "" && !sameAsCurrent}
            />
            <RuleItem
              label="Konfirmasi cocok"
              passed={values.confirm !== "" && values.confirm === values.next}
            />
          </ul>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4 lg:col-span-2">
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => {
              setValues(emptyValues);
              setCurrentError(null);
              setFormError(null);
            }}
          >
            Kosongkan
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              "Ganti Password"
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  error?: string;
}>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          className="pr-10"
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function RuleItem({ label, passed }: Readonly<{ label: string; passed: boolean }>) {
  return (
    <li
      className={cn(
        "flex items-center gap-2",
        passed ? "text-success" : "text-muted-foreground",
      )}
    >
      {passed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      {label}
    </li>
  );
}
