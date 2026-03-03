"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  createRoomSchema,
  type CreateRoomInput,
} from "@/domain/schemas/room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RoomFormProps {
  mode?: "create" | "edit";
  defaultValues?: Partial<CreateRoomInput>;
  onSubmit?: (data: CreateRoomInput) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function RoomForm({
  mode = "create",
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: RoomFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: defaultValues ?? {
      roomNumber: "",
      roomType: "",
      monthlyRent: undefined,
    },
  });

  const handleFormSubmit = async (data: CreateRoomInput) => {
    await onSubmit?.(data);
  };

  const titleKey =
    mode === "create" ? "room.create.title" : "room.edit.title";
  const submitKey =
    mode === "create" ? "room.create.submit" : "room.edit.submit";

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <h2 className="text-lg font-semibold">{t(titleKey)}</h2>
      <div className="space-y-2">
        <Label htmlFor="room-number">{t("room.create.roomNumber")}</Label>
        <Input
          id="room-number"
          {...register("roomNumber")}
          aria-invalid={!!errors.roomNumber}
          aria-describedby={errors.roomNumber ? "roomNumber-error" : undefined}
          className="min-h-[44px]"
        />
        {errors.roomNumber && (
          <p id="roomNumber-error" className="text-sm text-destructive">
            {errors.roomNumber.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="room-type">{t("room.create.roomType")}</Label>
        <Input
          id="room-type"
          {...register("roomType")}
          aria-invalid={!!errors.roomType}
          aria-describedby={errors.roomType ? "roomType-error" : undefined}
          className="min-h-[44px]"
        />
        {errors.roomType && (
          <p id="roomType-error" className="text-sm text-destructive">
            {errors.roomType.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="monthly-rent">{t("room.create.monthlyRent")}</Label>
        <Input
          id="monthly-rent"
          type="number"
          step="0.01"
          min={0}
          {...register("monthlyRent", { valueAsNumber: true })}
          aria-invalid={!!errors.monthlyRent}
          aria-describedby={errors.monthlyRent ? "monthlyRent-error" : undefined}
          className="min-h-[44px]"
        />
        {errors.monthlyRent && (
          <p id="monthlyRent-error" className="text-sm text-destructive">
            {errors.monthlyRent.message}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-h-[44px] min-w-[44px]"
        >
          {isLoading ? t("common.loading") : t(submitKey)}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="min-h-[44px] min-w-[44px]"
          >
            {t("room.create.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
