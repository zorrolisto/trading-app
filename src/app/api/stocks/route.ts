import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { inPossession, sUser, transaction } from "~/server/db/schema";
import type { ETypeTransaction } from "~/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    totalCostOfStocks: number;
    cash: number;
    userId: string;
    stockLatestPrice: number;
    stockInPosessionId: number;
    stockId: number;
    type: ETypeTransaction;
    totalCost: number;
    quantity: number;
  };
  await db
    .update(sUser)
    .set({
      totalCostOfStocks: String(body.totalCostOfStocks),
      cash: String(body.cash),
    })
    .where(eq(sUser.userId, body.userId));
  await db
    .update(inPossession)
    .set({
      totalCost: String(body.totalCost),
      quantity: String(body.quantity),
    })
    .where(eq(inPossession.id, body.stockInPosessionId));
  await db.insert(transaction).values({
    userId: String(body.userId),
    invested: String(body.stockLatestPrice),
    type: body.type,
    stockCost: String(body.stockLatestPrice),
    stockId: String(body.stockId),
  });

  return NextResponse.json({ ok: true });
}
