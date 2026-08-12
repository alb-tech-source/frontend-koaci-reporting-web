import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

import type { Company } from "./types";
import {
  formatDateID,
  legalStatusBadgeVariant,
  legalStatusLabel,
} from "./utils";

interface LegalDocumentsPanelProps {
  companies: Company[];
  selectedId: string;
  onSelectedIdChange: (id: string) => void;
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
            Daftar dokumen legal per perusahaan. Dokumen kedaluwarsa ditandai
            merah.
          </p>
        </div>
        <Select value={company?.id ?? ""} onValueChange={onSelectedIdChange}>
          <SelectTrigger className="h-9 w-full sm:w-72">
            <SelectValue placeholder="Pilih perusahaan" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jenis</TableHead>
              <TableHead>Nomor</TableHead>
              <TableHead>Tanggal Terbit</TableHead>
              <TableHead>Kedaluwarsa</TableHead>
              <TableHead>Status</TableHead>
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
              company.dokumen.map((doc) => {
                const expired = doc.status === "expired";
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium text-foreground">
                      {doc.jenis}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.nomor}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateID(doc.tanggalTerbit)}
                    </TableCell>
                    <TableCell
                      className={
                        expired
                          ? "text-sm font-medium text-danger"
                          : "text-sm text-muted-foreground"
                      }
                    >
                      {formatDateID(doc.tanggalKedaluwarsa)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={legalStatusBadgeVariant[doc.status]}>
                        {legalStatusLabel[doc.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}