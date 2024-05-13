import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { stockUser } from "~/server/db/schema";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const stock = await db.query.stockUser.findFirst({
    where: eq(stockUser.userId, String(userId)),
  });
  if (!stock) {
    const res = await db
      .insert(stockUser)
      .values({ cash: "1000", userId: String(userId) })
      .returning();
    return NextResponse.json({ stock: res[0] });
  }
  return NextResponse.json({ stock });
}
export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    numberOfStocks: number;
    totalCostOfStocks: number;
    cash: number;
    userId: string;
  };
  const stock = await db
    .update(stockUser)
    .set({
      numberOfStocks: String(body.numberOfStocks),
      totalCostOfStocks: String(body.totalCostOfStocks),
      cash: String(body.cash),
    })
    .where(eq(stockUser.userId, body.userId));
  return NextResponse.json({ stock });
}
