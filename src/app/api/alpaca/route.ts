import { type NextRequest, NextResponse } from "next/server";
import Alpaca from "@alpacahq/alpaca-trade-api";

const enum EIntervalo {
  HOY = "hoy",
  TRES_DIAS = "3d",
  UNA_SEMANA = "1w",
  UN_MES = "1m",
  SEIS_MESES = "6m",
  UN_ANO = "1y",
  CINCO_ANOS = "5y",
}
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(request: NextRequest) {
  const { intervalo } = (await request.json()) as {
    intervalo: EIntervalo;
  };
  const alpaca = new Alpaca({
    keyId: process.env.ALPACA_API_KEY_ID,
    secretKey: process.env.ALPACA_API_SECRET_KEY,
    paper: true,
  });

  let timeframe = alpaca.timeframeUnit.DAY;
  let start_time: Date;

  if (intervalo === EIntervalo.HOY) {
    start_time = new Date();
    start_time.setHours(0, 0, 0, 0);
    timeframe = alpaca.timeframeUnit.HOUR;
  } else if (intervalo === EIntervalo.TRES_DIAS) {
    start_time = new Date();
    start_time.setDate(start_time.getDate() - 3);
    timeframe = alpaca.timeframeUnit.HOUR;
  } else if (intervalo === EIntervalo.UNA_SEMANA) {
    start_time = new Date();
    start_time.setDate(start_time.getDate() - 7);
  } else if (intervalo === EIntervalo.UN_MES) {
    start_time = new Date();
    start_time.setDate(start_time.getDate() - 30);
  } else if (intervalo === EIntervalo.SEIS_MESES) {
    start_time = new Date();
    start_time.setDate(start_time.getDate() - 30 * 6);
    timeframe = alpaca.timeframeUnit.WEEK;
  } else if (intervalo === EIntervalo.UN_ANO) {
    start_time = new Date();
    start_time.setDate(start_time.getDate() - 365);
    timeframe = alpaca.timeframeUnit.WEEK;
  } else {
    start_time = new Date();
    start_time.setDate(start_time.getDate() - 365 * 5);
    timeframe = alpaca.timeframeUnit.MONTH;
  }

  const res = alpaca.getBarsV2("MSFT", {
    start: formatDate(start_time),
    timeframe: alpaca.newTimeframe(1, timeframe),
  });
  const respuesta = [];
  for await (const b of res) {
    respuesta.push(b);
  }

  return NextResponse.json({ respuesta, ok: true });
}
