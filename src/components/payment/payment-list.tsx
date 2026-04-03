"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { MoreVertical } from "lucide-react";
import type { Payment } from "@/domain/schemas/payment";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { format } from "date-fns";

interface PaymentListProps {
  payments: Payment[];
  isLoading?: boolean;
  onDeletePayment?: (paymentId: string) => void;
  isDeletingPayment?: boolean;
}


export function PaymentList({
  payments,
  isLoading = false,
  onDeletePayment,
  isDeletingPayment = false,
}: PaymentListProps) {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground">{t("payment.list.empty")}</p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3 list-none p-0 m-0">
        {payments.map((payment) => (
          <li key={payment.id} data-payment-id={payment.id}>
            <Card className="w-full">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <span className="text-sm font-medium">{payment.tenantName}</span>
                {onDeletePayment && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-[44px] min-w-[44px] -mr-2"
                        aria-label={t("payment.delete.moreOptions")}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setPendingDeleteId(payment.id)}
                      >
                        {t("payment.delete.button")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(payment.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("payment.list.date")}:{" "}
                  {format(
                    payment.paymentDate instanceof Date
                      ? payment.paymentDate
                      : new Date(payment.paymentDate),
                    "PPP"
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("payment.list.recorded")}:{" "}
                  {format(
                    payment.createdAt instanceof Date
                      ? payment.createdAt
                      : new Date(payment.createdAt),
                    "PPp"
                  )}
                </p>
                {payment.note && (
                  <p className="text-sm text-muted-foreground mt-1 italic">
                    {payment.note}
                  </p>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {onDeletePayment && (
        <Dialog
          open={pendingDeleteId !== null}
          onOpenChange={(open) => {
            if (!open) { setPendingDeleteId(null); }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("payment.delete.title")}</DialogTitle>
              <DialogDescription>
                {t("payment.delete.description")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                className="min-h-[44px]"
                onClick={() => setPendingDeleteId(null)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                className="min-h-[44px]"
                disabled={isDeletingPayment}
                onClick={() => {
                  if (pendingDeleteId) {
                    onDeletePayment(pendingDeleteId);
                    setPendingDeleteId(null);
                  }
                }}
              >
                {t("payment.delete.confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
