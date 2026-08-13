import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Separator } from "@/shared/components/ui/separator";

import { DocumentListPanel } from "@/features/investor-management/DocumentListPanel";
import type { Investor } from "./types";
import { formatIDR, statusBadgeVariant, statusLabel } from "./utils";

interface InvestorDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor: Investor | null;
}

function Field({ label, value }: Readonly<{ label: string; value?: string }>) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value || "-"}</dd>
    </div>
  );
}

export function InvestorDetailDialog({
  open,
  onOpenChange,
  investor,
}: Readonly<InvestorDetailDialogProps>) {
  
  if (!investor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border p-6">
          <DialogTitle>{investor.name}</DialogTitle>
          <DialogDescription>
            {investor.id} · {investor.email}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="flex items-center justify-between gap-3">
            <Badge variant={statusBadgeVariant[investor.status]}>
              {statusLabel[investor.status]}
            </Badge>
            <span className="text-sm font-semibold text-foreground">
              {formatIDR(investor.totalInvestasi)}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            <Field label="No. Telepon" value={investor.phone} />
            <Field
              label="Tipe Investor"
              value={
                investor.investorType === "individual"
                  ? "Individu"
                  : "Korporasi"
              }
            />
            <Field label="NIK" value={investor.nik} />
            <Field
              label="Jenis Kelamin"
              value={investor.gender === "men" ? "Laki-laki" : "Perempuan"}
            />
            <Field label="Nama Bank" value={investor.bankName} />
            <Field label="No. Rekening" value={investor.accountNumber} />
            <div className="col-span-2">
              <Field label="Alamat" value={investor.address} />
            </div>
          </dl>

          <Separator />

          <DocumentListPanel investorId={investor.id} />
          
        </div>
      </DialogContent>
    </Dialog>
  );
}