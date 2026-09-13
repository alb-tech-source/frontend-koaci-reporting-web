"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Loader2, Plus, Trash2 } from "lucide-react";
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

import { DeleteConfirmDialog } from "@/shared/components/ui/feedback";
import { getErrorMessage } from "@/shared/lib/axios";
import { formatDateID } from "@/shared/lib/format";
import type { Project } from "./types";
import {
  fetchProjectDocuments,
  uploadProjectDocument,
  deleteProjectDocument,
  downloadProjectDocument,
} from "./api";
import { Badge } from "@/shared/components/ui/badge";

interface ProjectDocumentsPanelProps {
  projects: Project[];
  selectedId: string;
  onSelectedIdChange: (id: string) => void;
}

const DOCUMENT_TYPES = [
  "PROPOSAL",
  "LAPORAN_KEUANGAN",
  "MOU",
  "KONTRAK",
  "LAINNYA",
];

// Bentuk mentah item dokumen dari GET /project-documents/project/:id
interface ApiProjectDocument {
  document_id?: string;
  id?: string;
  document_name?: string;
  name?: string;
  document_type?: string;
  file_size_bytes?: number;
  sizeBytes?: number;
  uploaded_at?: string;
  uploadedAt?: string;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "0 B";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function ProjectDocumentsPanel({
  projects,
  selectedId,
  onSelectedIdChange,
}: Readonly<ProjectDocumentsPanelProps>) {
  const queryClient = useQueryClient();
  const project = projects.find((p) => p.projectId === selectedId) ?? projects[0] ?? null;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ document_id: string; document_name: string } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["admin", "project-documents", project?.projectId],
    queryFn: () => fetchProjectDocuments(project!.projectId),
    enabled: !!project?.projectId,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!project || !file || !docName || !docType) throw new Error("Data tidak lengkap");
      return uploadProjectDocument(project.projectId, docType, docName, file);
    },
    onSuccess: () => {
      toast.success("Dokumen proyek berhasil diunggah!");
      setUploadOpen(false);
      resetUploadForm();
      queryClient.invalidateQueries({ queryKey: ["admin", "project-documents", project?.projectId] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Gagal mengunggah dokumen proyek.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteProjectDocument(documentId),
    onSuccess: () => {
      toast.success("Dokumen proyek berhasil dihapus!");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "project-documents", project?.projectId] });
    },
    onError: () => toast.error("Gagal menghapus dokumen proyek."),
  });

  const handleDownload = async (docId: string) => {
    setDownloadingId(docId);
    try {
      const url = await downloadProjectDocument(docId);
      if (!url) throw new Error("URL tidak valid");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Gagal mengunduh dokumen.");
    } finally {
      setDownloadingId(null);
    }
  };

  const resetUploadForm = () => {
    setDocName("");
    setDocType(DOCUMENT_TYPES[0]);
    setFile(null);
  };

  const renderDocumentsTableBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-5 w-5 animate-spin mb-2" /> Memuat dokumen...
          </TableCell>
        </TableRow>
      );
    }

    if (documents.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
            <FileText className="mx-auto h-6 w-6 opacity-20 mb-2" /> Belum ada dokumen untuk proyek ini.
          </TableCell>
        </TableRow>
      );
    }

    return documents.map((doc: ApiProjectDocument) => {
      const docId = doc.document_id || doc.id || "";
      const docName = doc.document_name || doc.name || "Tanpa Nama";
      return (
      <TableRow key={docId}>
        <TableCell className="font-medium">{docName}</TableCell>
        <TableCell><Badge variant="outline">{doc.document_type || "Lainnya"}</Badge></TableCell>
        <TableCell className="text-muted-foreground">{formatFileSize(doc.file_size_bytes || doc.sizeBytes)}</TableCell>
        <TableCell className="text-muted-foreground">{formatDateID(doc.uploaded_at || doc.uploadedAt || "")}</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleDownload(docId)} disabled={downloadingId === docId}>
              {downloadingId === docId ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Download className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-danger hover:bg-danger/10 hover:text-danger" onClick={() => setDeleteTarget({ document_id: docId, document_name: docName })}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      );
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-background shadow-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Dokumen Proyek</h2>
          <p className="text-xs text-muted-foreground">Kelola berkas proposal, laporan keuangan, dan MOU terkait proyek.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Select value={project?.projectId ?? ""} onValueChange={onSelectedIdChange}>
            <SelectTrigger className="h-9 w-full sm:w-72">
              <SelectValue placeholder="Pilih proyek" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.projectId} value={p.projectId}>
                  {p.projectKey} - {p.companyName || "Tanpa Nama Perusahaan"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="primary" size="sm" className="h-9 shrink-0" disabled={!project} onClick={() => setUploadOpen(true)}>
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
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderDocumentsTableBody()}</TableBody>
        </Table>
      </div>

      {/* MODAL UPLOAD */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!uploadMutation.isPending) { setUploadOpen(open); if (!open) resetUploadForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unggah Dokumen Proyek</DialogTitle>
            <DialogDescription>Format PDF, JPG, PNG, DOC, atau DOCX dengan ukuran maksimal 100 MB.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="docType">Tipe Dokumen <span className="text-danger">*</span></Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger id="docType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="docName">Nama Dokumen <span className="text-danger">*</span></Label>
              <Input id="docName" placeholder="Contoh: Proposal Proyek A" value={docName} onChange={(e) => setDocName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="docFile">File <span className="text-danger">*</span></Label>
              <Input id="docFile" type="file" accept=".pdf, image/jpeg, image/png, image/jpg, .doc, .docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="h-11 cursor-pointer pt-2 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-1 file:text-sm file:font-medium file:text-slate-900 hover:file:bg-slate-200" />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploadMutation.isPending}>Batal</Button>
            <Button className="bg-[#0275d8] text-white hover:bg-[#0275d8]/90 disabled:opacity-50" disabled={!file || !docName.trim() || uploadMutation.isPending} onClick={() => uploadMutation.mutate()}>
              {uploadMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengunggah...</> : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog 
        open={deleteTarget !== null}
        onOpenChange={(isOpen) => !isOpen && !deleteMutation.isPending && setDeleteTarget(null)}
        title="Hapus Dokumen Proyek"
        description={
          <>Yakin ingin menghapus dokumen <span className="font-semibold text-foreground">{deleteTarget?.document_name}</span>? Tindakan ini permanen.</>
        }
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.document_id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}