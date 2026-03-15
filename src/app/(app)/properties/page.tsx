"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePropertyContext } from "@/contexts/property-context";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PropertiesListPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const ctx = usePropertyContext();
  const { properties, activePropertyId, setActivePropertyId, isLoading, refetch } =
    ctx ?? {
      properties: [],
      activePropertyId: null,
      setActivePropertyId: () => {},
      isLoading: true,
      refetch: async () => {},
    };

  const [propertyToDelete, setPropertyToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelect = (id: string) => {
    setActivePropertyId(id);
    router.push("/");
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleConfirmDelete = async () => {
    if (!propertyToDelete) {return;}
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/properties/${propertyToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast({
          title: t("auth.error.generic"),
          description: body?.error ?? undefined,
          variant: "destructive",
        });
        return;
      }
      await refetch();
      if (propertyToDelete.id === activePropertyId) {
        queryClient.invalidateQueries({
          queryKey: ["dashboard", propertyToDelete.id],
        });
      }
      toast({ title: t("property.delete.success") });
      setPropertyToDelete(null);
    } catch {
      toast({
        title: t("auth.error.generic"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("property.list.title")}</h2>
        <p className="text-muted-foreground">{t("property.list.empty")}</p>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href="/properties/new">{t("property.create.submit")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("property.list.title")}</h2>
        <Button asChild size="sm" className="min-h-[44px] min-w-[44px]">
          <Link href="/properties/new">{t("property.create.submit")}</Link>
        </Button>
      </div>
      <ul className="flex flex-col gap-3">
        {properties.map((p) => (
          <li key={p.id}>
            <Card
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => handleSelect(p.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{p.name}</span>
                  <div className="flex items-center gap-1">
                    {activePropertyId === p.id && (
                      <Badge variant="secondary">{t("property.list.active")}</Badge>
                    )}
                    {user?.id === p.ownerId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-h-[44px] min-w-[44px] shrink-0"
                            aria-label={t("common.delete")}
                            onClick={handleDeleteClick}
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPropertyToDelete({ id: p.id, name: p.name });
                            }}
                          >
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {p.address || "—"}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <Dialog open={!!propertyToDelete} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t("property.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("property.delete.description")}
              {propertyToDelete && (
                <span className="mt-2 block font-medium text-foreground">
                  {propertyToDelete.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPropertyToDelete(null)}
              disabled={isDeleting}
              className="min-h-[44px] min-w-[44px]"
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="min-h-[44px] min-w-[44px]"
            >
              {isDeleting ? t("common.loading") : t("property.delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
