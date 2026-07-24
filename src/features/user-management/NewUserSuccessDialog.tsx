import { useState } from "react";
import { AlertTriangle, Check, Copy, Eye, EyeOff } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";

interface NewUserSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  fullName: string;
  email: string;
  password: string;
}

export function NewUserSuccessDialog({
  open,
  onClose,
  fullName,
  email,
  password,
}: NewUserSuccessDialogProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setVisible(false);
      setCopied(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-success/10">
            <Check className="h-6 w-6 text-success" />
          </div>
          <DialogTitle className="text-center">User Berhasil Dibuat</DialogTitle>
          <DialogDescription className="text-center">
            Akun untuk{" "}
            <span className="font-medium text-foreground">{fullName}</span> (
            {email}) telah dibuat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-3">
            <div className="mb-2 flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <Label className="text-xs font-medium">Password Sementara</Label>
            </div>
            <div className="flex items-center gap-2">
              <code
                className={cn(
                  "flex-1 truncate rounded-md bg-background px-3 py-2 font-mono text-sm text-foreground",
                )}
              >
                {visible ? password : "•".repeat(password.length)}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
                onClick={() => setVisible((v) => !v)}
              >
                {visible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Salin password"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-danger">
            Password ini <strong>HANYA ditampilkan satu kali</strong> dan tidak
            dapat dilihat kembali setelah jendela ini ditutup. Pastikan sudah
            disalin atau dicatat sebelum melanjutkan.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={() => handleOpenChange(false)}
          >
            Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}