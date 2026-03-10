"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { Room } from "@/domain/schemas/room";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { UserPlus, Wrench, Check, X } from "lucide-react";

/** Room data for card display; accepts API shape (date strings) or domain shape (Date). */
export type RoomForCard = Pick<
  Room,
  "id" | "propertyId" | "roomNumber" | "roomType" | "monthlyRent" | "status"
> & {
  createdAt?: Date | string;
  updatedAt?: Date | string;
  /** Set when status is occupied and API enriched the room */
  tenantId?: string;
  tenantName?: string;
  outstandingBalance?: number;
};

export interface RoomCardProps {
  room: RoomForCard;
  /** Used for room detail and for Available action links */
  propertyId: string;
  /** Used when occupied and we have tenantId — tap goes to tenant detail */
  tenantHref?: string;
  /** Optional: called when user taps "Assign Tenant" (Available rooms). If not set, links to room detail. */
  onAssignTenant?: (roomId: string) => void;
  /** Optional: called when user taps "Change room status" (Available rooms). If not set, links to room detail. */
  onChangeStatus?: (roomId: string) => void;
}

function roomDetailHref(propertyId: string, roomId: string): string {
  return `/properties/${propertyId}/rooms/${roomId}`;
}

export function RoomCard({
  room,
  propertyId,
  tenantHref,
  onAssignTenant,
  onChangeStatus,
}: RoomCardProps) {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const roomHref = roomDetailHref(propertyId, room.id);
  const occupiedHref = tenantHref ?? roomHref;
  const typeRent = `${room.roomType} · ${formatCurrency(room.monthlyRent)}${t("room.card.perMonth")}`;

  const baseCardClasses =
    "rounded-lg border border-border bg-card shadow-sm min-h-[44px] transition-colors hover:bg-muted/50";

  if (room.status === "available") {
    return (
      <Link
        href={roomHref}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        data-testid="room-card"
      >
        <Card
          className={`${baseCardClasses} border-l-4 border-status-available`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">
                {t("room.card.roomLabel")} {room.roomNumber}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-status-available/15 text-status-available-foreground"
                role="status"
                aria-label={t("room.status.available")}
              >
                {t("room.status.available")}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">{typeRent}</p>
            <div className="flex flex-col gap-1 border-t border-border pt-3">
              {onAssignTenant ? (
                <button
                  type="button"
                  className="flex min-h-[44px] min-w-[44px] items-center gap-2 text-primary text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAssignTenant(room.id);
                  }}
                  aria-label={t("room.card.assignTenant")}
                >
                  <UserPlus className="h-4 w-4" aria-hidden />
                  {t("room.card.assignTenant")}
                </button>
              ) : (
                <span className="flex min-h-[44px] min-w-[44px] items-center gap-2 text-primary text-sm font-medium rounded-md">
                  <UserPlus className="h-4 w-4" aria-hidden />
                  {t("room.card.assignTenant")}
                </span>
              )}
              <div className="h-px bg-border" aria-hidden />
              {onChangeStatus ? (
                <button
                  type="button"
                  className="flex min-h-[44px] min-w-[44px] items-center gap-2 text-muted-foreground text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChangeStatus(room.id);
                  }}
                  aria-label={t("room.card.changeStatus")}
                >
                  <Wrench className="h-4 w-4" aria-hidden />
                  {t("room.card.changeStatus")}
                </button>
              ) : (
                <span className="flex min-h-[44px] min-w-[44px] items-center gap-2 text-muted-foreground text-sm rounded-md">
                  <Wrench className="h-4 w-4" aria-hidden />
                  {t("room.card.changeStatus")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (room.status === "under_renovation") {
    return (
      <Link
        href={roomHref}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        data-testid="room-card"
      >
        <Card
          className={`${baseCardClasses} border-l-4 border-status-renovation bg-muted`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">
                {t("room.card.roomLabel")} {room.roomNumber}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-status-renovation/15 text-status-renovation-foreground"
                role="status"
                aria-label={t("room.status.under_renovation")}
              >
                {t("room.status.under_renovation")}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">{typeRent}</p>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // occupied
  const isPaid =
    room.outstandingBalance === undefined || room.outstandingBalance <= 0;
  return (
    <Link
      href={occupiedHref}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      data-testid="room-card"
    >
      <Card
        className={`${baseCardClasses} border-l-4 border-status-occupied`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="font-semibold text-foreground block">
                {t("room.card.roomLabel")} {room.roomNumber}
              </span>
              {room.tenantName && (
                <span className="font-semibold text-foreground block truncate">
                  {room.tenantName}
                </span>
              )}
            </div>
            {isPaid ? (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-balance-paid/15 text-balance-paid-foreground"
                role="status"
                aria-label={t("balance.status.paid")}
              >
                <Check className="h-3.5 w-3.5" aria-hidden />
                {t("balance.status.paid")}
              </span>
            ) : (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-balance-outstanding/15 text-balance-outstanding-foreground"
                role="status"
                aria-label={
                  room.outstandingBalance !== undefined && room.outstandingBalance !== null
                    ? `${formatCurrency(room.outstandingBalance)} ${t("balance.status.unpaid")}`
                    : t("balance.status.unpaid")
                }
              >
                {room.outstandingBalance !== undefined && room.outstandingBalance !== null
                  ? formatCurrency(room.outstandingBalance)
                  : ""}{" "}
                <X className="h-3.5 w-3.5" aria-hidden />
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">{typeRent}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
