"use client";

import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";

import { UserFormDialog } from "@/features/user-management/UserFormDialog";
import { NewUserSuccessDialog } from "@/features/user-management/NewUserSuccessDialog";

// IMPORT API LENGKAP
import { 
  fetchUsers, 
  createUser, 
  updateUser, 
  toggleUserActivation, 
  deleteUser 
} from "@/features/user-management/api";

import type {
  AppUser,
  UserFormValues,
  UserRole,
  UserStatus,
} from "@/features/user-management/types";
import {
  formatRelativeTime,
  roleBadgeClass,
  roleLabel,
  statusLabel,
} from "@/features/user-management/utils";
import { hasPermission } from "@/shared/lib/auth";

const usersQuery = queryOptions<AppUser[]>({
  queryKey: ["admin", "users"],
  queryFn: () => fetchUsers(1),
});

export default function AdminPenggunaPage() {
  const [mounted, setMounted] = useState(false);
    
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <PageSkeleton />;
  }

  if (!hasPermission("users:read")) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Akses Ditolak</h2>
        <p className="text-sm text-muted-foreground">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <UsersPageContent />
    </Suspense>
  );
}

const PAGE_SIZE = 10;

function UsersPageContent() {
  const { data: users } = useSuspenseQuery(usersQuery);
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<AppUser | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [createdUser, setCreatedUser] = useState<{
    fullName: string;
    email: string;
    password: string;
  } | null>(null);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

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

  const handleSubmit = async (values: UserFormValues) => {
    try {
      if (formMode === "edit" && editing) {
        await updateUser(editing.id, {
          firstname: values.firstName,
          lastname: values.lastName,
          email: values.email,
          role_name: values.role,
          permission_ids: values.permissions,
          is_active: values.activate,
        });
        
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        setFormOpen(false);
      } else {
        const response = await createUser({
          firstname: values.firstName,
          lastname: values.lastName,
          email: values.email,
          role_name: values.role,
          permission_ids: values.permissions,
          is_active: values.activate,
        });

        console.log("Response from createUser:", response);

        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        setFormOpen(false);
        setPage(1);

        const tempPassword = 
          response?.data?.temporary_password || 
          response?.data?.password || 
          response?.temporary_password || 
          response?.password || 
          response?.temp_password ||
          "CEK_CONSOLE_F12";

        setCreatedUser({
          fullName: `${values.firstName} ${values.lastName}`.trim(),
          email: values.email,
          password: tempPassword, 
        });
      }
    } catch (error) {
      console.error("Gagal menyimpan pengguna:", error);
    }
  };

  const toggleStatus = async (user: AppUser) => {
    try {
      await toggleUserActivation(user.id, user.status !== "active");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (error) {
      console.error("Gagal mengubah status:", error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id); 
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setDeleteTarget(null);
    } catch (error) {
      console.error("Gagal menghapus pengguna:", error);
    }
  };

  const isEmpty = pageItems.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Pengguna
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola akun pengguna sistem.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah User
        </Button>
      </header>

      <div className="rounded-2xl border border-border bg-background shadow-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Cari nama atau email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 pl-9"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v as UserRole | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-40">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="bod">BOD</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as UserStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-40">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
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
                <TableHead className="w-32 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEmpty ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64">
                    <EmptyState onAdd={openCreate} />
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {u.firstName} {u.lastName}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(roleBadgeClass(u.role))}>
                        {roleLabel[u.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.status === "active" ? (
                        <Badge className="border-transparent bg-success text-white">
                          {statusLabel.active}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          {statusLabel.inactive}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeTime(u.lastLoginAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit pengguna"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={
                            u.status === "active"
                              ? "Nonaktifkan pengguna"
                              : "Aktifkan pengguna"
                          }
                          onClick={() => toggleStatus(u)}
                        >
                          <Power
                            className={cn(
                              "h-4 w-4",
                              u.status === "active"
                                ? "text-success"
                                : "text-muted-foreground",
                            )}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Hapus pengguna"
                          onClick={() => setDeleteTarget(u)}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isEmpty && (
          <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Menampilkan{" "}
              <span className="font-medium text-foreground">
                {start + 1}-{start + pageItems.length}
              </span>{" "}
              dari{" "}
              <span className="font-medium text-foreground">
                {filtered.length}
              </span>{" "}
              pengguna
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <span className="text-xs text-muted-foreground">
                Hal. {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialUser={editing}
        onSubmit={handleSubmit}
      />

      <NewUserSuccessDialog
        open={createdUser !== null}
        onClose={() => setCreatedUser(null)}
        fullName={createdUser?.fullName ?? ""}
        email={createdUser?.email ?? ""}
        password={createdUser?.password ?? ""}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-danger/10">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <DialogTitle>Hapus Pengguna</DialogTitle>
            <DialogDescription>
              {deleteTarget ? (
                <>
                  Yakin menghapus{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget.firstName} {deleteTarget.lastName}
                  </span>
                  ? Tindakan ini permanen, tidak bisa dibatalkan.
                </>
              ) : (
                "Tindakan ini permanen, tidak bisa dibatalkan."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batalkan
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ onAdd }: Readonly<{ onAdd: () => void }>) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-muted">
        <UsersIcon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium text-foreground">Belum ada pengguna</p>
        <p className="text-sm text-muted-foreground">
          Tambahkan pengguna pertama untuk mulai mengelola akses sistem.
        </p>
      </div>
      <Button variant="primary" size="sm" onClick={onAdd}>
        <UserPlus className="h-4 w-4" />
        Tambah User
      </Button>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[480px] w-full rounded-2xl" />
    </div>
  );
}