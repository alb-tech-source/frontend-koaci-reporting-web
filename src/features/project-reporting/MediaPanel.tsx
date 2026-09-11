import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Image as ImageIcon, Loader2, Trash2, Upload, Video } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";

import { deleteReportingMedia, fetchReportingMedia, getMediaDownloadUrl, uploadReportingMedia } from "./api";
import type { ReportingMediaType } from "./types";
import { formatDateID, formatFileSize, mediaTypeLabel } from "./utils";

interface Props {
  reportingId: string;
  canUpload: boolean;
  canDelete: boolean;
}

const iconFor: Record<ReportingMediaType, typeof FileText> = {
  photo: ImageIcon,
  video: Video,
  document: FileText,
};

export function MediaPanel({ reportingId, canUpload, canDelete }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  
  const [mediaType, setMediaType] = useState<ReportingMediaType>("photo");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin", "reporting-media", reportingId],
    queryFn: () => fetchReportingMedia(reportingId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "reporting-media", reportingId] });
    queryClient.invalidateQueries({ queryKey: ["admin", "reportings"] }); 
  };

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadReportingMedia({
      project_reporting_id: reportingId,
      media_type: mediaType,
      media_name: file.name,
      file,
    }),
    onSuccess: () => {
      invalidate();
      toast.success("Media berhasil diunggah.");
      if (fileInput.current) fileInput.current.value = "";
    },
    onError: () => toast.error("Gagal mengunggah media."),
  });

  const deleteMutation = useMutation({
    mutationFn: (mediaId: string) => deleteReportingMedia(mediaId),
    onSuccess: () => {
      invalidate();
      toast.success("Media berhasil dihapus.");
      setConfirmId(null);
    },
    onError: () => toast.error("Gagal menghapus media."),
  });

  const handleDownload = async (mediaId: string) => {
    const url = await getMediaDownloadUrl(mediaId);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else toast.error("Tautan unduhan tidak tersedia.");
  };

  let mediaContent;

  if (isLoading) {
    mediaContent = (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  } else if (items.length === 0) {
    mediaContent = (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Belum ada media terlampir.</p>
      </div>
    );
  } else {
    mediaContent = (
      <ul className={items.length > 5 ? "space-y-2" : "grid gap-3 sm:grid-cols-2"}>
        {items.map((m) => {
          const Icon = iconFor[m.mediaType] ?? FileText;
          return (
            <li key={m.mediaId} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-sm transition-hover hover:border-brand/40">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground" title={m.mediaName}>{m.mediaName}</p>
                <p className="text-xs text-muted-foreground">
                  {mediaTypeLabel[m.mediaType]} · {formatFileSize(m.fileSizeBytes)} · {formatDateID(m.uploadedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(m.mediaId)}>
                  <Download className="h-4 w-4" />
                </Button>
                {canDelete && (
                  confirmId === m.mediaId ? (
                    <Button variant="danger" size="sm" className="h-8 px-2 text-xs" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(m.mediaId)}>
                      Yakin?
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:bg-danger/10 hover:text-danger" onClick={() => setConfirmId(m.mediaId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-foreground">Media Pendukung</h3>
        {canUpload && (
          <div className="flex items-center gap-2">
            <Select value={mediaType} onValueChange={(v) => setMediaType(v as ReportingMediaType)}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="photo">Foto</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="document">Dokumen</SelectItem>
              </SelectContent>
            </Select>

            <input
              ref={fileInput}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
              }}
            />

            <Button variant="outline" size="sm" className="h-9" disabled={uploadMutation.isPending} onClick={() => fileInput.current?.click()}>
              {uploadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload
            </Button>
          </div>
        )}
      </div>

      {mediaContent}
    </section>
  );
}