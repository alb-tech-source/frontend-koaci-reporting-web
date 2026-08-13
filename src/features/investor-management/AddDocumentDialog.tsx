"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Upload } from "lucide-react";

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

// Constants
export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
export const ACCEPTED_DOCUMENT_TYPES = ".pdf,.jpg,.jpeg,.png";
export type DocumentMimeType = "application/pdf" | "image/jpeg" | "image/png";

// Helper internal file ini
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function resolveMimeType(file: File): DocumentMimeType | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf"))
    return "application/pdf";
  if (name.endsWith(".png") || file.type === "image/png") return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg") || file.type === "image/jpeg")
    return "image/jpeg";
  return null;
}

export interface NewDocumentInput {
  name: string;
  mimeType: DocumentMimeType;
  sizeBytes: number;
}

interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting?: boolean;
  onUpload: (input: NewDocumentInput, file: File) => void;
}

export function AddDocumentDialog({
  open,
  onOpenChange,
  isSubmitting = false,
  onUpload,
}: Readonly<AddDocumentDialogProps>) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setFile(null);
      setError(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [open]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama dokumen wajib diisi.");
      return;
    }
    if (!file) {
      setError("Pilih file terlebih dahulu.");
      return;
    }
    const mimeType = resolveMimeType(file);
    if (!mimeType) {
      setError("Format file harus PDF, JPG, atau PNG.");
      return;
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      setError("Ukuran file maksimal 5 MB.");
      return;
    }
    setError(null);
    
    onUpload({ name: name.trim(), mimeType, sizeBytes: file.size }, file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Dokumen</DialogTitle>
          <DialogDescription>
            Format PDF, JPG, atau PNG dengan ukuran maksimal 5 MB.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-name">
              Nama Dokumen <span className="text-danger">*</span>
            </Label>
            <Input
              id="doc-name"
              placeholder="Contoh: KTP Investor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-file">
              File <span className="text-danger">*</span>
            </Label>
            <Input
              ref={inputRef}
              id="doc-file"
              type="file"
              accept={ACCEPTED_DOCUMENT_TYPES}
              disabled={isSubmitting}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                // Auto-fill nama dokumen jika masih kosong
                if (e.target.files?.[0] && !name) {
                  setName(e.target.files[0].name.split('.')[0]);
                }
                setError(null);
              }}
              className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm"
            />
            {file ? (
              <p className="text-xs text-muted-foreground">
                {file.name} · {formatFileSize(file.size)}
              </p>
            ) : null}
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengunggah...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}