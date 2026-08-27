"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Download, 
  Loader2, 
  Plus, 
  Trash2, 
  FileText, 
  AlertTriangle,
  Upload // ✅ Tambahkan icon Upload
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

import type { Company, CompanyDocument } from "./types";
import { formatDateID } from "./utils";
import {
  uploadCompanyDocument,
  downloadCompanyDocument,
  deleteCompanyDocument,
} from "./api";
import { getErrorMessage } from "@/shared/lib/axios";

interface LegalDocumentsPanelProps {
  companies: Company[];
  selectedId: string;
  onSelectedIdChange: (id: string) => void;
}

const DOCUMENT_TYPES = [
  "AKTA_PENDIRIAN",
  "SK_KEMENKUMHAM",
  "NPWP",
  "NIB",
  "SIUP",
  "TDP",
  "PROFIL_PERUSAHAAN",
  "LAINNYA",
];

function formatFileSize(bytes: number): string {
  if (!bytes) return "0 B";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function LegalDocumentsPanel({
  companies,
  selectedId,
  onSelectedIdChange,
}: Readonly<LegalDocumentsPanelProps>) {
  const queryClient = useQueryClient();
  const company = companies.find((c) => c.id === selectedId) ?? companies[0] ?? null;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CompanyDocument | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!company || !file || !docName || !docType) throw new Error("Data tidak lengkap");
      return uploadCompanyDocument(company.id, docType, docName, file);
    },
    onSuccess: () => {
      toast.success("Dokumen berhasil diunggah!");
      setUploadOpen(false);
      resetUploadForm();
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Gagal mengunggah dokumen.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteCompanyDocument(documentId),
    onSuccess: () => {
      toast.success("Dokumen berhasil dihapus!");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Gagal menghapus dokumen.")),
  });

  const resetUploadForm = () => {
    setDocName("");
    setDocType(DOCUMENT_TYPES[0]);
    setFile(null);
  };

  const handleDownload = async (doc: CompanyDocument) => {
    setIsDownloading(doc.id);
    try {
      const url = await downloadCompanyDocument(doc.id);
      if (!url) throw new Error("URL unduhan tidak valid");

      const link = document.createElement("a");
      link.href = url;
      link.download = doc.nama || "dokumen_legalitas";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal mengunduh dokumen."));
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-background shadow-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Dokumen Legalitas</h2>
          <p className="text-xs text-muted-foreground">
            Daftar dokumen legal per perusahaan yang telah diunggah.
          </p>
        </div>
        
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Select value={company?.id ?? ""} onValueChange={onSelectedIdChange}>
            <SelectTrigger className="h-9 w-full sm:w-72">
              <SelectValue placeholder="Pilih perusahaan" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c, index) => (
                <SelectItem
                  key={c.id || `company-fallback-${index}`}
                  value={c.id || `val-${index}`}
                >
                  {c.nama || "Perusahaan Tanpa Nama"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="primary"
            size="sm"
            className="h-9 shrink-0"
            disabled={!company}
            onClick={() => setUploadOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Tambah Dokumen
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Dokumen</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Ukuran File</TableHead>
              <TableHead>Tanggal Diunggah</TableHead>
              <TableHead>Diunggah Oleh</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!company || company.dokumen.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                  Belum ada dokumen legalitas.
                </TableCell>
              </TableRow>
            ) : (
              company.dokumen.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {doc.nama}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground uppercase">
                    {doc.tipe.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFileSize(doc.fileSizeBytes)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateID(doc.uploadedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {doc.uploadedBy || "-"}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isDownloading === doc.id}
                        onClick={() => handleDownload(doc)}
                        aria-label="Unduh dokumen"
                      >
                        {isDownloading === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-danger hover:text-danger hover:bg-danger/10"
                        onClick={() => setDeleteTarget(doc)}
                        aria-label="Hapus dokumen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL UPLOAD DOKUMEN */}
      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          if (!uploadMutation.isPending) {
            setUploadOpen(open);
            if (!open) resetUploadForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Dokumen</DialogTitle>
            <DialogDescription>
              Format PDF, JPG, atau PNG dengan ukuran maksimal 10 MB.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="docType">Tipe Dokumen <span className="text-danger">*</span></Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger id="docType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="docName">Nama Dokumen <span className="text-danger">*</span></Label>
              <Input
                id="docName"
                placeholder="Contoh: NPWP Perusahaan 2024"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="docFile">File <span className="text-danger">*</span></Label>
              {/* ✅ Tombol Choose File dimodifikasi dengan latar abu-abu (bg-secondary/bg-slate-100) dan border radius */}
              <Input
                id="docFile"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="h-11 cursor-pointer pt-2 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-1 file:text-sm file:font-medium file:text-slate-900 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-200"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setUploadOpen(false)}
              disabled={uploadMutation.isPending}
            >
              Batal
            </Button>
            {/* ✅ Tombol Upload dimodifikasi menggunakan warna biru solid tegas (tanpa efek gradien/pudar) dan ditambahkan Ikon Upload */}
            <Button
              className="bg-[#0275d8] text-white hover:bg-[#0275d8]/90 disabled:opacity-50"
              disabled={!file || !docName.trim() || uploadMutation.isPending}
              onClick={() => uploadMutation.mutate()}
            >
              {uploadMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengunggah...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> Upload</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL KONFIRMASI HAPUS DOKUMEN */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && !deleteMutation.isPending && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-danger/10">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <DialogTitle>Hapus Dokumen</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus dokumen <span className="font-semibold text-foreground">{deleteTarget?.nama}</span>? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...</>
              ) : (
                "Ya, Hapus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}