"use client";

import { queryOptions, useSuspenseQuery, useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Power, Search, UserPlus, Users as UsersIcon, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/lib/axios";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";

import { ClientGuard } from "@/shared/components/ClientGuard";
import { EmptyStateGeneral, PageSkeleton, DeleteConfirmDialog } from "@/shared/components/ui/feedback";
import { usePaginatedList } from "@/shared/hooks/use-pagination";

import { UserFormDialog } from "@/features/user-management/UserFormDialog";
import { NewUserSuccessDialog } from "@/features/user-management/NewUserSuccessDialog";
import { fetchUsers, createUser, updateUser, toggleUserActivation, deleteUser, fetchPermissions } from "@/features/user-management/api";
import type { AppUser, UserFormValues, UserRole, UserStatus } from "@/features/user-management/types";
import { roleBadgeClass, roleLabel, statusLabel } from "@/features/user-management/utils";
import { formatRelativeTime } from "@/shared/lib/format";
import { hasPermission, getCurrentRole } from "@/shared/lib/auth";

const usersQuery = queryOptions<AppUser[]>({
  queryKey: ["admin", "users"],
  queryFn: () => fetchUsers(),
});

export default function AdminPenggunaPage() {
  return (
    <ClientGuard requirePermission="users:read" fallback={<PageSkeleton />}>
      <UsersPageContent />
    </ClientGuard>
  );
}

const PAGE_SIZE = 10;

function UsersPageContent() {
  const { data: users } = useSuspenseQuery(usersQuery);
  const queryClient = useQueryClient();

  const currentRole = getCurrentRole();
  const isExecutive = ["superadmin", "bod"].includes(currentRole ?? "");

  const canCreate = hasPermission("users:create") || isExecutive;
  const canUpdate = hasPermission("users:update") || isExecutive;
  const canDelete = hasPermission("users:delete") || isExecutive;
  const hasActions = canUpdate || canDelete;

  const { data: permissionsList = [] } = useQuery({
    queryKey: ["permissions"],
    queryFn: fetchPermissions,
    staleTime: 5 * 60 * 1000,
  });

  const canDeleteUser = (target: AppUser): boolean => canDelete && target.role !== "bod";

  const canActOnTarget = (target: AppUser): boolean => {
    if (target.role === "bod" || target.role === "superadmin") return currentRole === "bod";
    return true;
  };

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<AppUser | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [createdUser, setCreatedUser] = useState<{ fullName: string; email: string; password: string } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const name = `${u.firstName} ${u.lastName}`.toLowerCase();
      const matchQ = !q || name.includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" || u.status === statusFilter;
      return matchQ && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const { setPage, pageItems, totalPages, currentPage, start } = usePaginatedList(filtered, PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      return await createUser(
        {
          firstname: values.firstName,
          lastname: values.lastName,
          email: values.email,
          role_name: values.role,
          permission_ids: values.permissions,
          is_active: values.activate,
        },
        permissionsList 
      );
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setFormOpen(false);
      setPage(1);

      const tempPassword = response?.data?.temporaryPassword || "Gagal mendapatkan password";
      setCreatedUser({
        fullName: `${variables.firstName} ${variables.lastName}`.trim(),
        email: variables.email,
        password: tempPassword,
      });
      toast.success("Pengguna baru berhasil ditambahkan."); 
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menambahkan pengguna."))
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UserFormValues }) => {
      return await updateUser(
        id,
        {
          firstname: values.firstName,
          lastname: values.lastName,
          email: values.email,
          role_name: values.role,
          permission_ids: values.permissions,
          is_active: values.activate,
        },
        permissionsList
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setFormOpen(false);
      setEditing(null);
      toast.success("Data pengguna berhasil diperbarui."); 
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal memperbarui pengguna."))
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleUserActivation(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Status pengguna berhasil diubah.");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal mengubah status pengguna.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setDeleteTarget(null);
      toast.success("Pengguna berhasil dihapus.");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menghapus pengguna.")),
  });

  const openCreate = () => {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setFormMode("edit");
    setEditing(u);
    setFormOpen(true);
  };

  const handleSubmit = (values: UserFormValues) => {
    if (formMode === "edit" && editing) updateMutation.mutate({ id: editing.id, values });
    else createMutation.mutate(values);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  const isEmpty = pageItems.length === 0;
  const isFormSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pengguna</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola akun pengguna sistem.</p>
        </div>
        {canCreate && (
          <Button variant="primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tambah User
          </Button>
        )}
      </header>

      <div className="rounded-2xl border border-border bg-background shadow-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input type="search" placeholder="Cari nama atau email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-9 pl-9" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as UserRole | "all"); setPage(1); }}>
              <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue placeholder="Semua Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
                <SelectItem value="bod">BOD</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as UserStatus | "all"); setPage(1); }}>
              <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue placeholder="Semua Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terakhir Login</TableHead>
                {hasActions && <TableHead className="w-32 text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEmpty ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64">
                    <EmptyStateGeneral 
                      title="Belum ada pengguna" 
                      description="Tambahkan pengguna pertama untuk mulai mengelola akses sistem."
                      icon={UsersIcon}
                      action={canCreate ? <Button variant="primary" size="sm" onClick={openCreate}><UserPlus className="h-4 w-4" /> Tambah User</Button> : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell><div className="font-medium text-foreground">{u.firstName} {u.lastName}</div></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Badge className={cn(roleBadgeClass(u.role))}>{roleLabel[u.role]}</Badge></TableCell>
                    <TableCell>
                      {u.status === "active" ? (
                        <Badge className="border-transparent bg-success text-white">{statusLabel.active}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">{statusLabel.inactive}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatRelativeTime(u.lastLoginAt)}</TableCell>
                    {hasActions && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canUpdate && canActOnTarget(u) && (
                            <>
                              <Button variant="ghost" size="icon" aria-label="Edit pengguna" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" aria-label={u.status === "active" ? "Nonaktifkan pengguna" : "Aktifkan pengguna"} disabled={toggleMutation.isPending && toggleMutation.variables?.id === u.id} onClick={() => toggleMutation.mutate({ id: u.id, isActive: u.status !== "active" })}>
                                <Power className={cn("h-4 w-4", u.status === "active" ? "text-success" : "text-muted-foreground")} />
                              </Button>
                            </>
                          )}
                          {canDelete && canDeleteUser(u) && canActOnTarget(u) && (
                            <Button variant="ghost" size="icon" aria-label="Hapus pengguna" onClick={() => setDeleteTarget(u)}><Trash2 className="h-4 w-4 text-danger" /></Button>
                          )}
                          {!canActOnTarget(u) && (
                            <Button variant="ghost" size="icon" aria-label="Akun dilindungi" disabled title="Hanya BOD yang dapat mengubah akun ini">
                              <ShieldCheck className="h-4 w-4 text-muted-foreground/40" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isEmpty && (
          <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Menampilkan <span className="font-medium text-foreground">{start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)}</span> dari <span className="font-medium text-foreground">{filtered.length}</span> pengguna
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Sebelumnya</Button>
              <span className="text-xs text-muted-foreground">Hal. {currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Berikutnya</Button>
            </div>
          </div>
        )}
      </div>

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} mode={formMode} initialUser={editing} onSubmit={handleSubmit} currentUserRole={currentRole ?? "admin"} isSubmitting={isFormSubmitting} />
      <NewUserSuccessDialog open={createdUser !== null} onClose={() => setCreatedUser(null)} fullName={createdUser?.fullName ?? ""} email={createdUser?.email ?? ""} password={createdUser?.password ?? ""} />

      {/* ✅ Menggunakan Global Delete Dialog */}
      <DeleteConfirmDialog 
        open={deleteTarget !== null}
        onOpenChange={(isOpen) => !isOpen && !deleteMutation.isPending && setDeleteTarget(null)}
        title="Hapus Pengguna"
        description={
          <>Yakin menghapus profil pengguna <span className="font-medium text-foreground">{deleteTarget?.firstName} {deleteTarget?.lastName}</span>? Tindakan ini permanen dan tidak bisa dibatalkan.</>
        }
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}