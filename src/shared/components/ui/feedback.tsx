import { AlertTriangle, FolderKanban, Loader2 } from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";

export function AccessDenied({ message }: Readonly<{ message?: string }>) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Akses Ditolak</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {message ?? "Anda tidak memiliki izin untuk mengakses halaman ini."}
      </p>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[480px] w-full rounded-2xl" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[420px] w-full rounded-2xl" />
    </div>
  );
}

export function EmptyStateGeneral({
  title,
  description,
  icon: Icon = FolderKanban,
  action
}: Readonly<{ title: string; description: string; icon?: React.ComponentType<{ className?: string }>; action?: React.ReactNode }>) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title = "Konfirmasi Hapus",
  description,
  onConfirm,
  isPending
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: React.ReactNode;
  onConfirm: () => void;
  isPending?: boolean;
}>) {
  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-danger/10">
            <AlertTriangle className="h-5 w-5 text-danger" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Batal
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...</>
            ) : (
              "Ya, Hapus"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}