import { NextResponse } from "next/server";
import { z } from "zod";
import { updateExpenseSchema } from "@/domain/schemas/expense";
import { withPropertyAccess } from "@/lib/property-access";
import { expenseService } from "@/lib/expense-service-instance";

function expenseToJson(e: {
  id: string;
  propertyId: string;
  category: string;
  amount: number;
  date: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: e.id,
    propertyId: e.propertyId,
    category: e.category,
    amount: e.amount,
    date: e.date instanceof Date ? e.date.toISOString().split("T")[0] : e.date,
    description: e.description,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ propertyId: string; expenseId: string }> }
) {
  const { propertyId, expenseId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {
    return access.errorResponse;
  }

  try {
    const expense = await expenseService.getExpense(
      access.userId!,
      propertyId,
      expenseId
    );
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json(expenseToJson(expense), { status: 200 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ propertyId: string; expenseId: string }> }
) {
  const { propertyId, expenseId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request, includeProperty: true });
  if (access.errorResponse) {
    return access.errorResponse;
  }
  if (access.role === "owner" && access.property?.staffOnlyFinance) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = updateExpenseSchema.parse(body);
    const expense = await expenseService.updateExpense(
      access.userId!,
      propertyId,
      expenseId,
      data
    );
    return NextResponse.json(expenseToJson(expense), { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.flatten().fieldErrors;
      return NextResponse.json({ errors }, { status: 400 });
    }
    if (err instanceof Error) {
      if (err.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (err.message.includes("not found")) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ propertyId: string; expenseId: string }> }
) {
  const { propertyId, expenseId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request, includeProperty: true });
  if (access.errorResponse) {
    return access.errorResponse;
  }
  if (access.role === "owner" && access.property?.staffOnlyFinance) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await expenseService.deleteExpense(access.userId!, propertyId, expenseId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (err.message.includes("not found")) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
