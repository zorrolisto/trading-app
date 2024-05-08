"use client";

import { SignedOut, SignedIn } from "@clerk/nextjs";
import type { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import { data } from "~/constants";
import {
  ERemitente,
  type IData,
  type ICandle,
  type IMensaje,
  type IStock,
} from "~/types";
import dynamic from "next/dynamic";

const ChartDynamic = dynamic(() => import("./_components/chart"), {
  ssr: false,
});

export default function HomePage() {
  const [candlesData, setCandlesData] = useState<ICandle[]>([]);
  const [selectFilter, setSelectFilter] = useState(0);
  const [mensajes, setMensajes] = useState<IMensaje[]>([]);
  const [inputChat, setInputChat] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [userStock, setUserStock] = useState<IStock | null>(null);
  const [stockLatestPrice, setStockLatestPrice] = useState(0);

  const filters = ["hoy", "3d", "1w", "1m", "6m", "1y", "5y"];

  useEffect(() => {
    // if (data.series[0]) setCandlesData(data.series[0].data);
    // setStockLatestPrice(600);
    void getCandlesDataByFilter();
    void getUserStock();
  }, []);

  const getUserStock = async () => {
    const res = await fetch("/api/stocks");
    const { stock } = (await res.json()) as { stock: IStock };
    setUserStock(stock);
  };
  const filterDataByDate = async (date: string) => {
    setSelectFilter(filters.findIndex((d) => d === date));
    await getCandlesDataByFilter(date);
  };
  const askAI = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    setInputChat("");
    void getResponseFromAI(inputChat);
  };
  const getResponseFromAI = async (messageForAI: string) => {
    setLoadingResponse(true);
    const mensajesWithNew = [
      ...mensajes,
      {
        orden: mensajes.length + 1,
        text: messageForAI,
        remitente: ERemitente.PERSONA,
      },
    ];
    setMensajes(mensajesWithNew);
    const res = await fetch("http://localhost:8000/agent/invoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: {
          input: messageForAI,
          chat_history: mensajesWithNew.map((m) => ({
            type: m.remitente,
            content: m.text,
          })),
        },
      }),
    });
    const {
      output: { output: response },
    } = (await res.json()) as { output: { output: string } };
    setLoadingResponse(false);
    mensajesWithNew.push({
      orden: mensajesWithNew.length + 1,
      text: response,
      remitente: ERemitente.MAQUINA,
    });
    setMensajes(mensajesWithNew);
  };
  const getHowMuchIEarned = () => {
    if (!userStock?.costOfStock) return null;
    const sign = stockLatestPrice - userStock.costOfStock > 0 ? "+" : "";
    return sign + String(stockLatestPrice - userStock.costOfStock) + "$";
  };
  const sellStock = async () => {
    if (userStock)
      setUserStock({
        ...userStock,
        costOfStock: null,
        cash: Number(userStock.cash) + stockLatestPrice,
      });
    await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        costOfStock: null,
        cash: Number(userStock?.cash) + stockLatestPrice,
      }),
    });
  };
  const buyStock = async () => {
    if (userStock)
      setUserStock({
        ...userStock,
        costOfStock: stockLatestPrice,
        cash: Number(userStock.cash) - stockLatestPrice,
      });
    await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        costOfStock: stockLatestPrice,
        cash: Number(userStock?.cash) - stockLatestPrice,
      }),
    });
  };
  const getCandlesDataByFilter = async (date = "hoy") => {
    const res = await fetch("https://alpaca-server.vercel.app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intervalo: date }),
    });

    if (!res.ok) throw new Error(`Error en la solicitud: ${res.status}`);

    const response = (await res.json()) as { respuesta: IData[] };
    if (stockLatestPrice === 0)
      setStockLatestPrice(Number(response.respuesta[0]?.high));
    const candlesFormat = response.respuesta.map((r) => ({
      x: new Date(r.timestamp),
      y: [r.open, r.high, r.low, r.close],
    }));
    setCandlesData(candlesFormat);
  };

  return (
    <main>
      <SignedOut>
        <div className="flex h-[80vh] w-full items-center justify-center text-center text-2xl font-semibold text-gray-500">
          Logueate arriba para entrar a la web de trading
          <br />
          💸💸💸
        </div>
      </SignedOut>
      <SignedIn>
        <div className="flex flex-row justify-between gap-3 p-6">
          <div className="w-full">
            <div className="mb-1 flex items-center justify-between gap-5">
              <h3 className="text-2xl font-medium text-gray-800">
                Gráfico de Velas
                <strong className="ml-1 text-gray-500">(MSFT)</strong>
              </h3>
              {userStock && (
                <div className="flex items-center">
                  <div className="mr-2 text-sm">
                    Saldo
                    <strong className="mx-1 text-gray-500">
                      {Number(userStock?.cash).toFixed(2)}$
                    </strong>
                  </div>
                  <div className="mr-2 text-sm">
                    Tienes
                    <strong className="mx-1 text-gray-500">
                      {Number(userStock.costOfStock !== null)} acciones
                    </strong>
                    <span className="text-success">{getHowMuchIEarned()}</span>
                  </div>
                  <div className="space-x-1">
                    {userStock.costOfStock === null ? (
                      <button
                        className="btn btn-primary btn-xs text-white"
                        onClick={buyStock}
                      >
                        Comprar ({stockLatestPrice}$)
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-xs text-white"
                        onClick={sellStock}
                      >
                        Vender ({stockLatestPrice}$)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="h-[50vh] rounded-xl border-2 border-gray-300">
              {window !== undefined && (
                <ChartDynamic
                  options={data.options as unknown as ApexOptions}
                  data={
                    [{ data: candlesData }] as unknown as ApexAxisChartSeries
                  }
                />
              )}
            </div>
            <div className="mt-2 flex items-center gap-1">
              <p className="text-sm">Filtros de fecha: </p>
              {filters.map((f, idx) => (
                <button
                  key={idx}
                  className="btn btn-primary btn-xs text-white"
                  style={{
                    backgroundColor:
                      idx === selectFilter ? "#6e00ff" : "#7480ff",
                  }}
                  onClick={() => filterDataByDate(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="w-3/12">
            <h3 className="mb-1 text-2xl font-medium text-gray-800">
              Trading Bot
            </h3>
            <div className="h-[50vh] rounded-xl border-2 border-gray-300">
              <div className="h-[87.5%] overflow-auto">
                <div className="chat chat-start">
                  <div className="chat-bubble chat-bubble-primary text-sm text-white">
                    Hola, estoy aquí para ayudarte :{")"}
                  </div>
                </div>
                {mensajes.map((m, idx) => (
                  <div
                    key={idx}
                    className={
                      "chat " +
                      (m.remitente === ERemitente.MAQUINA
                        ? "chat-start"
                        : "chat-end")
                    }
                  >
                    <div
                      className={
                        "chat-bubble text-sm text-white " +
                        (m.remitente === ERemitente.MAQUINA
                          ? "chat-bubble-primary"
                          : "chat-bubble-info")
                      }
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex h-[12.5%] items-center justify-center border-t-2 border-gray-300">
                <input
                  className="mx-1.5 w-full rounded-lg bg-gray-100 p-1.5 text-sm text-gray-600"
                  type="text"
                  placeholder="Pregunta algo..."
                  onChange={(e) => setInputChat(e.target.value)}
                  value={inputChat}
                  onKeyUp={askAI}
                />
              </div>
            </div>
            {loadingResponse && (
              <div className="mt-1 w-full text-center text-xs font-bold text-primary">
                La IA está pensando...
              </div>
            )}
          </div>
        </div>
      </SignedIn>
    </main>
  );
}
