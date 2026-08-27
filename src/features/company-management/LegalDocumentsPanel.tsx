"use client";

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

import type { Company } from "./types";
import { formatDateID } from "./utils";

interface LegalDocumentsPanelProps {
  companies: Company[];
  selectedId: string;
  onSelectedIdChange: (id: string) => void;
}

// Helper untuk format ukuran file
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
  const company =
    companies.find((c) => c.id === selectedId) ?? companies[0] ?? null;

  return (
    <div className="rounded-2xl border border-border bg-background shadow-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Dokumen Legalitas
          </h2>
          <p className="text-xs text-muted-foreground">
            Daftar dokumen legal per perusahaan yang telah diunggah.
          </p>
        </div>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {!company || company.dokumen.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  Belum ada dokumen legalitas.
                </TableCell>
              </TableRow>
            ) : (
              company.dokumen.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium text-foreground">
                    {doc.nama}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground uppercase">
                    {doc.tipe}
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}