"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { Room } from "@/domain/schemas/room";
import { StatusIndicator } from "@/components/room/status-indicator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useFormatCurrency } from "@/hooks/use-format-currency";

interface RoomCardProps {
  room: Room;
  href: string;
}

export function RoomCard({ room, href }: RoomCardProps) {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();

  return (
    <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card
        className="min-h-[44px] transition-colors hover:bg-muted/50"
        data-testid="room-card"
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{room.roomNumber}</span>
            <StatusIndicator status={room.status} size="small" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            {room.roomType}
          </p>
          <p className="text-sm font-medium">
            {formatCurrency(room.monthlyRent)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
