import { useState } from "react";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { formatDateID } from "@/shared/lib/format";
import type { ProjectInvestment } from "./types";

interface ReceiptPanelProps {
  investment: ProjectInvestment;
  onUpload: (file: File, receiptName: string) => Promise<void>;
  onDelete: (receiptDocumentId: string) => Promise<void>;
  onDownload: (receiptDocumentId: string) => Promise<void>;
  canManage?: boolean;
}

export function ReceiptPanel({
  investment,
  onUpload,
  onDelete,
  onDownload,
  canManage,
}: Readonly<ReceiptPanelProps>) {
  const receipt = investment.receiptDocument;
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUploadClick = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      await onUpload(file, file.name);
      setFile(null); // Reset input setelah sukses
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadClick = async () => {
    if (!receipt) return;
    setIsDownloading(true);
    try {
      await onDownload(receipt.receiptDocumentId);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!receipt) return;
    setIsDeleting(true);
    try {
      await onDelete(receipt.receiptDocumentId);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-background p-4 shadow-card">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Kwitansi Transaksi</h3>

      {receipt ? (
        <div className="flex flex-col justify-between rounded-xl border bg-card p-3 shadow-sm transition-hover hover:border-brand/40 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-success/10 text-success">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground" title={receipt.receiptName}>
                {receipt.receiptName}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Diunggah pada {formatDateID(receipt.uploadedAt)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t pt-3 sm:mt-0 sm:border-0 sm:pt-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={handleDownloadClick}
              disabled={isDownloading}
            >
              {isDownloading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
              Unduh
            </Button>
            {canManage && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-danger hover:bg-danger/10 hover:text-danger"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
            <FileText className="mb-2 h-6 w-6 opacity-20" />
            <p className="text-sm">Belum ada kwitansi transaksi yang dilampirkan.</p>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf, image/jpeg, image/png, image/jpg"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={isUploading}
                className="h-9 cursor-pointer py-1.5 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-0.5 file:text-xs file:font-medium file:text-slate-900 hover:file:bg-slate-200"
              />
              <Button
                variant="primary"
                size="sm"
                className="h-9 shrink-0"
                disabled={!file || isUploading}
                onClick={handleUploadClick}
              >
                {isUploading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Mengunggah...</> : <><Upload className="mr-1.5 h-4 w-4" /> Unggah</>}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}