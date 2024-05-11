import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { stockUser } from "~/server/db/schema";

export async function GET() {
  const stock = await db.query.stockUser.findFirst();
  return NextResponse.json({ stock });
}
export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    numberOfStocks: number;
    totalCostOfStocks: number;
    cash: number;
  };
  // eslint-disable-next-line drizzle/enforce-update-with-where
  const stock = await db.update(stockUser).set({
    numberOfStocks: String(body.numberOfStocks),
    totalCostOfStocks: String(body.totalCostOfStocks),
    cash: String(body.cash),
  });
  return NextResponse.json({ stock });
}
