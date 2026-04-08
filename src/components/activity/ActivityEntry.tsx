"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import type { ActivityLogEntry } from "@/domain/schemas/activity-log";

interface ActivityEntryProps {
  entry: ActivityLogEntry;
}

function useActionDescription(
  actionCode: string,
  metadata: Record<string, unknown>
): string {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();

  const amount =
    typeof metadata.amount === "number"
      ? formatCurrency(metadata.amount)
      : String(metadata.amount ?? "");

  if (actionCode === "SETTINGS_STAFF_FINANCE_TOGGLED") {
    const key = metadata.enabled
      ? "activity.actions.SETTINGS_STAFF_FINANCE_TOGGLED_ON"
      : "activity.actions.SETTINGS_STAFF_FINANCE_TOGGLED_OFF";
    return t(key);
  }

  return t(`activity.actions.${actionCode}`, {
    amount,
    tenantName: String(metadata.tenantName ?? ""),
    roomName: String(metadata.roomName ?? ""),
    fromRoom: String(metadata.fromRoom ?? ""),
    toRoom: String(metadata.toRoom ?? ""),
    category: String(metadata.category ?? ""),
  });
}

export function ActivityEntry({ entry }: ActivityEntryProps) {
  const { t } = useTranslation();
  const description = useActionDescription(entry.actionCode, entry.metadata);
  const isOwner = entry.actorRole === "owner";
  const [showExact, setShowExact] = useState(false);

  const date = new Date(entry.createdAt);
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });
  const exactTime = format(date, "MMM d, yyyy · HH:mm");

  return (
    <div className="flex gap-3 py-3 border-b border-border last:border-0">
      <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary mt-2" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-foreground">{entry.actorName}</span>
          <Badge
            variant={isOwner ? "default" : "secondary"}
            className="text-[10px] px-1.5 py-0"
          >
            {t(`activity.roles.${entry.actorRole}`)}
          </Badge>
          <button
            type="button"
            onClick={() => setShowExact((v) => !v)}
            className="text-xs text-muted-foreground ml-auto py-2 underline decoration-dotted underline-offset-2 cursor-pointer min-h-[44px]"
            aria-label={showExact ? exactTime : relativeTime}
          >
            {showExact ? exactTime : relativeTime}
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 break-words">{description}</p>
      </div>
    </div>
  );
}
