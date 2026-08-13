"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Download,
  FileImage,
  FileText,
  FolderOpen,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { getErrorMessage } from "@/shared/lib/axios";

import {
  fetchInvestorDocuments,
  deleteInvestorDocument,
  downloadInvestorDocument,
  uploadInvestorDocument,
} from "./api";
import { AddDocumentDialog, type NewDocumentInput } from "./AddDocumentDialog";

interface DocumentListPanelProps {
  investorId: string;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "0 B";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatRelativeID(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "-";
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  return `${Math.floor(months / 12)} tahun lalu`;
}

function DocumentIcon({ mimeType }: Readonly<{ mimeType: string }>) {
  const isPdf = mimeType === "application/pdf";
  const Icon = isPdf ? FileText : FileImage;
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        isPdf ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary",
      )}
      aria-hidden="true"
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function DocumentListPanel({
  investorId,
  className,
}: Readonly<DocumentListPanelProps>) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["investor-documents", investorId],
    queryFn: () => fetchInvestorDocuments(investorId),
    enabled: !!investorId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (input: NewDocumentInput & { file: File }) => {
      return await uploadInvestorDocument(investorId, input.name, input.file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investor-documents", investorId] });
      toast.success("Dokumen berhasil diunggah.");
      setAddOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Gagal mengunggah dokumen."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => deleteInvestorDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investor-documents", investorId] });
      toast.success("Dokumen berhasil dihapus.");
      setPendingDelete(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Gagal menghapus dokumen."));
    },
  });

  const handleDownload = async (docId: string) => {
    setIsDownloading(docId);
    try {
      const res = await downloadInvestorDocument(docId);
      if (res?.downloadUrl) {
        window.open(res.downloadUrl, "_blank");
      } else {
        throw new Error("URL unduhan tidak ditemukan.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal mengunduh dokumen."));
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Dokumen Pendukung</h3>
          <p className="text-xs text-muted-foreground">
            {isLoading ? "Memuat..." : `${documents.length} dokumen tersimpan`}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <FolderOpen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Belum ada dokumen diunggah.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc: any) => (
            <li
              key={doc.document_id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 shadow-card"
            >
              <DocumentIcon mimeType={doc.mime_type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {doc.document_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(doc.file_size_bytes)} · {formatRelativeID(doc.uploaded_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Unduh ${doc.document_name}`}
                  disabled={isDownloading === doc.document_id}
                  onClick={() => handleDownload(doc.document_id)}
                >
                  {isDownloading === doc.document_id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Hapus ${doc.document_name}`}
                  className="text-danger hover:text-danger"
                  onClick={() => setPendingDelete(doc)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddDocumentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        isSubmitting={uploadMutation.isPending}
        onUpload={(input, file) => uploadMutation.mutate({ ...input, file })}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus dokumen ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Dokumen “{pendingDelete?.document_name}” akan dihapus permanen dan tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) deleteMutation.mutate(pendingDelete.document_id);
              }}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menghapus...</>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}