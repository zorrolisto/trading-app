import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { inPossession, sUser, transaction } from "~/server/db/schema";
import Alpaca from "@alpacahq/alpaca-trade-api";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  // ---- Stocks ----
  const stocks = await db.query.stock.findMany();
  // ---- User stock ----
  const stockUser = await db.query.sUser.findFirst({
    where: eq(sUser.userId, String(userId)),
  });
  if (!stockUser) {
    const res = await db
      .insert(sUser)
      .values({ cash: "1000", userId: String(userId) })
      .returning();
    return NextResponse.json({ stock: res[0] });
  }
  // ---- InPossession ----
  let stocksInPossessions = await db.query.inPossession.findMany({
    where: eq(inPossession.userId, String(userId)),
    orderBy: [desc(inPossession.totalCost)],
  });
  if ((!stocksInPossessions || stocksInPossessions.length === 0) && stocks) {
    stocksInPossessions = await db
      .insert(inPossession)
      .values(
        stocks.map((s) => ({
          userId: String(userId),
          stockId: String(s.id),
          quantity: "0",
          totalCost: "0",
        })),
      )
      .returning();
  }
  // ---- Transactions ----
  const transactions = await db.query.transaction.findMany({
    where: eq(transaction.userId, String(userId)),
    orderBy: [desc(transaction.id)],
  });

  // --------STOCKS LATEST PRICE
  const alpaca = new Alpaca({
    keyId: process.env.ALPACA_API_KEY_ID,
    secretKey: process.env.ALPACA_API_SECRET_KEY,
    paper: true,
  });
  const namesInMarket = stocks.map((s) => s.nameInMarket);
  const timeframe = alpaca.timeframeUnit.DAY;
  const start_time = new Date();
  start_time.setHours(0, 0, 0, 0);
  const respuesta: ResponseData = namesInMarket.reduce(
    (accum, s) => ({ ...accum, [s]: [] }),
    {},
  );
  for (const { nameInMarket } of stocks) {
    const res = alpaca.getBarsV2(nameInMarket, {
      start: formatDate(start_time),
      timeframe: alpaca.newTimeframe(1, timeframe),
    });
    for await (const b of res) {
      const rn = respuesta[nameInMarket];
      if (rn !== undefined) rn.push(b);
    }
  }
  const stocksLatestPrice: StockPrices = {};
  for (const [stock, bars] of Object.entries(respuesta)) {
    if (bars[0]) stocksLatestPrice[stock] = bars[0].ClosePrice;
  }

  return NextResponse.json({
    stocks,
    stockUser,
    transactions,
    stocksInPossessions,
    stocksLatestPrice,
  });
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Definir tipo para barras de datos
type Bar = {
  ClosePrice: number;
};

// Definir tipo para precios de acciones
type StockPrices = Record<string, number>;

// Definir tipo para la respuesta
type ResponseData = Record<string, Bar[]>;
