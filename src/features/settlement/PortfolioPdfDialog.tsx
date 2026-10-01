import { useQuery } from "@tanstack/react-query";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { getErrorMessage } from "@/shared/lib/axios";

import type { PortfolioSigner } from "./portfolioPdf";
import { settlementDetailQuery } from "./queries";
import { formatDateID, formatRupiah } from "./utils";

export interface PortfolioPdfTarget {
  settlementId: string;
  investorSettlementId: string;
}

const SIGNER_STORAGE_KEY = "koaci-portfolio-signer";
const DEFAULT_SIGNER: PortfolioSigner = {
  name: "Norman Ibrahim Sultan",
  title: "Investment Advisor",
};

// Penanda tangan terakhir diingat per browser agar tidak perlu diketik ulang
function loadSigner(): PortfolioSigner {
  try {
    const raw = localStorage.getItem(SIGNER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (typeof parsed?.name === "string" && parsed.name.trim()) {
      return {
        name: parsed.name,
        title: typeof parsed.title === "string" ? parsed.title : "",
      };
    }
  } catch {
    // localStorage tidak tersedia — pakai default
  }
  return DEFAULT_SIGNER;
}

function saveSigner(signer: PortfolioSigner) {
  try {
    localStorage.setItem(SIGNER_STORAGE_KEY, JSON.stringify(signer));
  } catch {
    // abaikan — hanya kenyamanan
  }
}

interface PortfolioPdfDialogProps {
  target: PortfolioPdfTarget | null;
  onOpenChange: (open: boolean) => void;
}

export function PortfolioPdfDialog({
  target,
  onOpenChange,
}: Readonly<PortfolioPdfDialogProps>) {
  const open = target !== null;
  const { data: settlement, isLoading } = useQuery({
    ...settlementDetailQuery(target?.settlementId ?? ""),
    enabled: open,
  });
  const investor = settlement?.investors.find(
    (i) => i.investorSettlementId === target?.investorSettlementId,
  );

  const [signer, setSigner] = useState<PortfolioSigner>(DEFAULT_SIGNER);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Isi ulang penanda tangan setiap dialog dibuka — pola reset-saat-render
  const resetKey = target?.investorSettlementId ?? "tutup";
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setError(null);
    if (target) setSigner(loadSigner());
  }

  const isApproved = settlement?.status === "approved";

  const handleGenerate = async () => {
    if (!settlement || !investor) return;
    if (!signer.name.trim()) {
      setError("Nama penanda tangan wajib diisi.");
      return;
    }
    const finalSigner = { name: signer.name.trim(), title: signer.title.trim() };

    setGenerating(true);
    try {
      // Dimuat saat dibutuhkan agar jsPDF tidak memperberat halaman
      const { generatePortfolioPdf } = await import("./portfolioPdf");
      await generatePortfolioPdf({ settlement, investor, signer: finalSigner });
      saveSigner(finalSigner);
      toast.success(`PDF portofolio ${investor.investorName} berhasil dibuat.`);
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal membuat PDF portofolio."));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !generating && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unduh Portofolio Akhir</DialogTitle>
          <DialogDescription>
            Surat rincian pengembalian modal dan bagi hasil untuk investor.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !settlement ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : !investor ? (
          <p className="text-sm text-danger">
            Data investor tidak ditemukan pada settlement ini.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3 text-sm">
              <SummaryItem label="Investor" value={investor.investorName} />
              <SummaryItem label="Proyek" value={settlement.projectKey} mono />
              <SummaryItem
                label="Modal Disetor"
                value={formatRupiah(investor.principalAmount)}
              />
              <SummaryItem
                label="Total Bagi Hasil"
                value={formatRupiah(investor.totalProfit)}
              />
              <SummaryItem
                label="Tanggal Surat (approval)"
                value={formatDateID(settlement.updatedAt)}
              />
            </div>

            {!isApproved ? (
              <p className="rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning">
                Portofolio akhir hanya bisa dibuat setelah settlement disetujui.
              </p>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="signerName">Nama Penanda Tangan *</Label>
              <Input
                id="signerName"
                value={signer.name}
                onChange={(e) => {
                  setSigner((s) => ({ ...s, name: e.target.value }));
                  setError(null);
                }}
              />
              {error ? (
                <p className="text-xs text-danger" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signerTitle">Jabatan</Label>
              <Input
                id="signerTitle"
                value={signer.title}
                placeholder="mis. Investment Advisor"
                onChange={(e) =>
                  setSigner((s) => ({ ...s, title: e.target.value }))
                }
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generating}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={generating || !investor || !isApproved}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Membuat PDF...
              </>
            ) : (
              <>
                <FileDown className="mr-1.5 h-4 w-4" /> Unduh PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryItem({
  label,
  value,
  mono = false,
}: Readonly<{ label: string; value: string; mono?: boolean }>) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`truncate font-medium text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
