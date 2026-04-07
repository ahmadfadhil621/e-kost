"use client";

import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ActivityFiltersValue {
  area: string;
  actorId: string;
}

interface Actor {
  id: string;
  name: string;
}

interface ActivityFiltersProps {
  value: ActivityFiltersValue;
  actors: Actor[];
  onChange: (value: ActivityFiltersValue) => void;
}

export function ActivityFilters({ value, actors, onChange }: ActivityFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2">
      <Select
        value={value.area}
        onValueChange={(area) => onChange({ ...value, area })}
      >
        <SelectTrigger className="flex-1 h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("activity.filters.allAreas")}</SelectItem>
          <SelectItem value="finance">{t("activity.filters.finance")}</SelectItem>
          <SelectItem value="tenant">{t("activity.filters.tenant")}</SelectItem>
          <SelectItem value="rooms">{t("activity.filters.rooms")}</SelectItem>
          <SelectItem value="settings">{t("activity.filters.settings")}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={value.actorId}
        onValueChange={(actorId) => onChange({ ...value, actorId })}
      >
        <SelectTrigger className="flex-1 h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("activity.filters.allStaff")}</SelectItem>
          {actors.map((actor) => (
            <SelectItem key={actor.id} value={actor.id}>
              {actor.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
