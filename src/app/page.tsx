"use client";

import { SignedOut, SignedIn } from "@clerk/nextjs";
import type { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { data } from "~/constants";
// import { db } from "~/server/db";

export const dynamic = "force-dynamic";

/*async function Images() {
  const images = await db.query.images.findMany({
    orderBy: (model, { asc }) => asc(model.name),
  });
  return (
    <div className="flex flex-wrap gap-4">
      {images.map((img) => (
        <div key={img.id} className="w-48 p-4">
          <img src={img.url} />
          <div>{img.name}</div>
        </div>
      ))}
    </div>
  );
}*/
interface IData {
  timestamp: string;
  open: number;
  low: number;
  high: number;
  close: number;
}
interface ICandle {
  x: Date;
  y: number[];
}
const enum ERemitente {
  MAQUINA,
  PERSONA,
}
interface IMensaje {
  orden: number;
  text: string;
  remitente: ERemitente;
}

export default function HomePage() {
  const [candlesData, setCandlesData] = useState<ICandle[]>([]);
  const [selectFilter, setSelectFilter] = useState(0);
  const [mensajes, setMensajes] = useState<IMensaje[]>([]);
  const [inputChat, setInputChat] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);

  const filters = ["hoy", "3d", "1w", "1m", "6m", "1y", "5y"];

  useEffect(() => {
    //if (data.series[0]) setCandlesData(data.series[0].data);
    void getCandlesDataByFilter();
  }, []);

  const filterDataByDate = async (date: string) => {
    setSelectFilter(filters.findIndex((d) => d === date));
    await getCandlesDataByFilter(date);
  };
  const askAI = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    void getResponseFromAI(inputChat);
    setInputChat("");
  };
  const getResponseFromAI = async (messageForAI: string) => {
    setLoadingResponse(true);
    setMensajes((msjs) => [
      ...msjs,
      {
        orden: mensajes.length + 1,
        text: messageForAI,
        remitente: ERemitente.PERSONA,
      },
    ]);
    const res = await fetch("http://localhost:8000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageForAI }),
    });

    if (!res.ok) throw new Error(`Error en la solicitud: ${res.status}`);

    const response = (await res.json()) as { respuesta: string };
    console.log(response);
    setLoadingResponse(false);
    setMensajes((msjs) => [
      ...msjs,
      {
        orden: msjs.length + 1,
        text: response.respuesta,
        remitente: ERemitente.MAQUINA,
      },
    ]);
  };
  const getCandlesDataByFilter = async (date = "hoy") => {
    const res = await fetch("http://localhost:8001", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intervalo: date }),
    });

    if (!res.ok) throw new Error(`Error en la solicitud: ${res.status}`);

    const response = (await res.json()) as { respuesta: IData[] };
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
            <div className="mb-1 flex items-center gap-5">
              <h3 className="text-2xl font-medium text-gray-800">
                Gráfico de Velas{" "}
                <strong className="text-gray-500">(SPY)</strong>
              </h3>
            </div>
            <div className="h-[50vh] rounded-xl border-2 border-gray-300">
              <ReactApexChart
                options={data.options as unknown as ApexOptions}
                series={
                  [{ data: candlesData }] as unknown as ApexAxisChartSeries
                }
                type="candlestick"
                height={380}
              />
            </div>
            <div className="mt-2 flex items-center gap-1">
              <p className="text-sm">Filtros de fecha: </p>
              {filters.map((f, idx) => (
                <button
                  key={idx}
                  className="btn btn-xs btn-primary text-white"
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
                  className="mx-1.5 w-full rounded-lg bg-gray-100 p-1.5 text-sm"
                  type="text"
                  placeholder="Pregunta algo..."
                  onChange={(e) => setInputChat(e.target.value)}
                  onKeyUp={askAI}
                />
              </div>
            </div>
            {loadingResponse && (
              <div className="text-primary mt-1 w-full text-center text-xs font-bold">
                La IA está pensando...
              </div>
            )}
          </div>
        </div>
      </SignedIn>
    </main>
  );
}
