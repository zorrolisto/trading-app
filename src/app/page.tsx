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
  type ICarteraDeAcciones,
} from "~/types";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import ManualDeUsuario from "./_components/ManualDeUsuario";

const ChartDynamic = dynamic(() => import("./_components/chart"), {
  ssr: false,
});

export default function HomePage() {
  const [candlesData, setCandlesData] = useState<ICandle[]>([]);
  const [selectFilter, setSelectFilter] = useState(0);
  const [mensajes, setMensajes] = useState<IMensaje[]>([
    {
      orden: 0,
      remitente: ERemitente.MAQUINA,
      text: "Hola soy StockBot, necesitas un consejo? :)",
    },
  ]);
  const [inputChat, setInputChat] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [userStock, setUserStock] = useState<IStock | null>(null);
  const [carteraDeAcciones, setCarteraDeAcciones] =
    useState<ICarteraDeAcciones | null>({ earn: 0, total: 0 });
  const [stockLatestPrice, setStockLatestPrice] = useState(0);
  const { userId } = useAuth();

  const filters = ["hoy", "3d", "1w", "1m", "6m", "1y", "5y"];

  useEffect(() => {
    // if (data.series[0]) setCandlesData(data.series[0].data);
    // setStockLatestPrice(600);
    if (userId) {
      void getCandlesDataByFilter();
      void getUserStock();
    }
  }, [userId]);
  useEffect(() => {
    updateCarteraDeAcciones();
  }, [userStock, stockLatestPrice]);

  const getUserStock = async () => {
    const res = await fetch("/api/stocks?userId=" + userId);
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
        text:
          messageForAI +
          "--- metadata de este mensaje: userStock = " +
          JSON.stringify(userStock) +
          ", carteraDeAcciones = " +
          JSON.stringify(carteraDeAcciones),
        remitente: ERemitente.PERSONA,
      },
    ];
    setMensajes(mensajesWithNew);
    const res = await fetch(
      process.env.NEXT_PUBLIC_CHATBOT_API + "/agent/invoke",
      {
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
      },
    );
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
  const updateCarteraDeAcciones = () => {
    if (!userStock || stockLatestPrice === 0) return null;
    const costoAhora = userStock.numberOfStocks * stockLatestPrice;
    setCarteraDeAcciones({
      earn: costoAhora - userStock.totalCostOfStocks,
      total: costoAhora,
    });
  };
  const sellStock = async () => {
    if (!userStock || !userId) return;
    const cash =
      Number(userStock.cash) + stockLatestPrice * userStock.numberOfStocks;
    const [numberOfStocks, totalCostOfStocks] = [0, 0];
    setUserStock({ ...userStock, numberOfStocks, totalCostOfStocks, cash });
    await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numberOfStocks, totalCostOfStocks, cash, userId }),
    });
  };
  const addCash = async () => {
    if (!userStock || !userId) return;
    const cash = Number(userStock.cash) + 1000;
    setUserStock({
      ...userStock,
      cash,
    });
    await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        numberOfStocks: userStock.numberOfStocks,
        totalCostOfStocks: userStock.totalCostOfStocks,
        cash,
        userId,
      }),
    });
  };
  const buyStock = async () => {
    if (!userStock || !userId) return;
    const numberOfStocks = Number(userStock.numberOfStocks) + 1;
    const totalCostOfStocks =
      Number(userStock.totalCostOfStocks) + stockLatestPrice;
    const cash = Number(userStock.cash) - stockLatestPrice;
    setUserStock({ ...userStock, numberOfStocks, totalCostOfStocks, cash });
    await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numberOfStocks, totalCostOfStocks, cash, userId }),
    });
  };
  const getCandlesDataByFilter = async (date = "hoy") => {
    const res = await fetch("/api/alpaca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intervalo: date }),
    });

    if (!res.ok) throw new Error(`Error en la solicitud: ${res.status}`);

    const response = (await res.json()) as { respuesta: IData[] };
    if (stockLatestPrice === 0)
      setStockLatestPrice(
        response.respuesta[response.respuesta.length - 1]?.ClosePrice ?? 0,
      );
    // setStockLatestPrice(200);
    const candlesFormat = response.respuesta.map((r) => ({
      x: new Date(r.Timestamp),
      y: [r.OpenPrice, r.HighPrice, r.LowPrice, r.ClosePrice],
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
        <div className="p-6">
          <div className="space-y-5">
            <div className="flex gap-3">
              <div className="flex gap-3 rounded-xl border-2 border-gray-200 p-4">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                  width={35}
                  height={35}
                  alt="msft logo"
                />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-gray-600">MFST</div>
                    <div className="flex items-end">
                      <span className="mr-1 pb-[0.2rem] text-xs">precio: </span>
                      <div>${!userStock ? "-" : stockLatestPrice}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <span className="text-xs">Microsoft Inc.</span>
                    <button
                      className="btn btn-primary btn-xs text-white"
                      onClick={buyStock}
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border-2 border-gray-200 p-4">
                <div className="flex items-center gap-10">
                  <div className="font-bold text-gray-600">
                    Cartera de Acciones
                  </div>
                  <span className="mt-0.5 text-xs">
                    {!userStock ? "-" : userStock.numberOfStocks} acciones
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {carteraDeAcciones && (
                      <>
                        <div>{carteraDeAcciones?.total.toFixed(2)}$</div>
                        {carteraDeAcciones?.earn !== 0 && (
                          <span
                            className={`ml-2 text-sm
                            ${
                              carteraDeAcciones.earn < 0
                                ? "text-red-500"
                                : "text-green-500"
                            } `}
                          >
                            {carteraDeAcciones?.earn >= 0 && "+"}
                            {carteraDeAcciones?.earn.toFixed(2)}$
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <button
                    className="btn btn-primary btn-xs text-white"
                    onClick={sellStock}
                  >
                    Vender
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border-2 border-gray-200 p-4">
                <div className="flex items-center gap-16">
                  <div className="font-bold text-gray-600">Cash</div>
                  <button
                    className="btn btn-primary btn-xs text-white"
                    onClick={addCash}
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center justify-between gap-10">
                  {!userStock ? "-" : Number(userStock?.cash).toFixed(2)}$
                </div>
              </div>
              <div className="ml-auto flex flex-col gap-2 rounded-xl border-2 border-gray-200 p-4">
                <div className="text-center font-bold text-gray-600">
                  Manual de Usuario
                </div>
                <button
                  className="btn btn-primary btn-xs text-white"
                  onClick={() => {
                    const element: { showModal: () => 0 } =
                      document?.getElementById("my_modal_2") as unknown as {
                        showModal: () => 0;
                      };
                    element.showModal();
                  }}
                >
                  Abrir
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-full">
                <div className="h-[50vh] rounded-xl border-2 border-gray-200">
                  <ChartDynamic
                    options={data.options as unknown as ApexOptions}
                    data={
                      [{ data: candlesData }] as unknown as ApexAxisChartSeries
                    }
                  />
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <p className="text-sm">Filtros de fecha: </p>
                  {filters.map((f, idx) => (
                    <button
                      key={idx}
                      className="btn btn-primary btn-xs border-2 text-white"
                      style={{
                        backgroundColor:
                          idx === selectFilter ? "#fff" : "#4a00ff",
                        color: idx === selectFilter ? "#4a00ff" : "#fff",
                      }}
                      onClick={() => filterDataByDate(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[50vh] w-4/12 rounded-xl border-2 border-gray-200">
                <div className="h-5/6 overflow-auto px-1.5 py-4">
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
                        {m.text.split("---")[0]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex h-1/6 items-center justify-center">
                  <input
                    className="h-full w-full rounded-b-lg bg-gray-50 p-3 text-sm text-gray-600"
                    type="text"
                    placeholder="Pregunta algo..."
                    onChange={(e) => setInputChat(e.target.value)}
                    value={inputChat}
                    onKeyUp={askAI}
                  />
                </div>
                {loadingResponse && (
                  <div className="mt-1 w-full text-center text-xs font-bold text-primary">
                    La IA está pensando...
                  </div>
                )}
              </div>
            </div>
          </div>
          <ManualDeUsuario />
        </div>
      </SignedIn>
    </main>
  );
}
