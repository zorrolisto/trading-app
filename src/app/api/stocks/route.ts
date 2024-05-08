import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { stockUser } from "~/server/db/schema";

export async function GET() {
  const stock = await db.query.stockUser.findFirst();
  console.log("stock");
  console.log(stock);
  return NextResponse.json({ stock });
}
export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    costOfStock: string | null;
    cash: number;
  };
  console.log("formData", body);
  // eslint-disable-next-line drizzle/enforce-update-with-where
  const stock = await db.update(stockUser).set({
    costOfStock: body.costOfStock,
    cash: String(body.cash),
  });
  console.log("stock");
  console.log(stock);
  return NextResponse.json({ stock });
}
