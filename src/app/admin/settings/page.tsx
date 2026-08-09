"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import { fetchAllPermissions, fetchRolePermissions, updateRolePermissions } from "@/features/settings/api";
import { hasPermission } from "@/shared/lib/auth";

export default function SettingsPage() {
  const canManage = hasPermission("users:manage_roles");
  const { data: allPermissions } = useQuery({ queryKey: ["permissions"], queryFn: fetchAllPermissions });
  const [selected, setSelected] = useState<string[]>([]);

  const saveMutation = useMutation({
    mutationFn: () => updateRolePermissions("admin", selected),
    onSuccess: () => toast.success("Pengaturan izin Admin berhasil disimpan."),
    onError: () => toast.error("Gagal menyimpan pengaturan."),
  });

  if (!canManage) return <p className="text-sm text-muted-foreground">Tidak memiliki akses.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan Izin Role Admin</h1>
      <div className="grid grid-cols-2 gap-3 rounded-lg border p-4">
        {allPermissions?.map((p) => (
          <label key={p.permission_id} className="flex items-center gap-2">
            <Checkbox
              checked={selected.includes(p.permission_id)}
              onCheckedChange={(c) =>
                setSelected((prev) => c ? [...prev, p.permission_id] : prev.filter((id) => id !== p.permission_id))
              }
            />
            {p.permission_key}
          </label>
        ))}
      </div>
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        Simpan Pengaturan
      </Button>
    </div>
  );
}