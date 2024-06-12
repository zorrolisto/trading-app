"use client";

import { SignedOut, SignedIn } from "@clerk/nextjs";
import type { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import { data, defaultMessages } from "~/constants";
import {
  ERemitente,
  type IData,
  type ICandle,
  type IMensaje,
  type IStock,
  type ICarteraDeAcciones,
  type IStockUser,
  type IStockInPossession,
  type ITransaction,
  type IInitPage,
  ETypeTransaction,
} from "~/types";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import ManualDeUsuario from "./_components/ManualDeUsuario";

const ChartDynamic = dynamic(() => import("./_components/chart"), {
  ssr: false,
});

const StockTableColumn = (props: { stock: IStock | undefined }) => {
  if (!props.stock) return;
  return (
    <div className="flex items-center gap-3">
      <div className="avatar">
        <div className="mask mask-squircle h-10 w-10">
          <Image
            src={
              props.stock?.imageUrl ??
              "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
            }
            width={25}
            height={25}
            alt="msft logo"
          />
        </div>
      </div>
      <div>
        <div className="text-xs font-bold">{props.stock.nameInMarket}</div>
        <div className="text-xs opacity-50">{props.stock.name}</div>
      </div>
    </div>
  );
};
const StockGanancia = (props: {
  stock: IStock | undefined;
  quantity: number;
  totalCost: number;
  stocksLatestPrice: Record<string, number>;
}) => {
  if (!props.stock) return;
  const n = props.stock?.nameInMarket ?? "";
  const price = props.stocksLatestPrice[n] ?? 0;
  const ganancia = price * props.quantity - props.totalCost;
  return (
    <td
      className={`text-bold ${ganancia < 0 ? "text-red-500" : "text-green-500"}`}
    >
      {ganancia.toFixed(2)}
    </td>
  );
};

export default function HomePage() {
  const [candlesData, setCandlesData] = useState<ICandle[]>([]);
  const [selectFilter, setSelectFilter] = useState(0);
  const [tabSelected, setTabSelected] = useState(3);
  const [mensajes, setMensajes] = useState<IMensaje[]>(defaultMessages);
  const [inputChat, setInputChat] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [userStock, setUserStock] = useState<IStockUser | null>(null);
  const [stocks, setStocks] = useState<IStock[]>([]);
  const [stockSelected, setStockSelected] = useState<IStock>();
  const [stocksInPossession, setStocksInPossession] = useState<
    IStockInPossession[]
  >([]);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [carteraDeAcciones, setCarteraDeAcciones] =
    useState<ICarteraDeAcciones | null>({ earn: 0, total: 0 });
  const [stocksLatestPrice, setStocksLatestPrice] = useState<
    Record<string, number>
  >({});
  const [stockLatestPrice, setStockLatestPrice] = useState(0);
  const { userId } = useAuth();

  const filters = ["hoy", "3d", "1w", "1m", "6m", "1y", "5y"];

  useEffect(() => {
    // if (data.series[0]) setCandlesData(data.series[0].data);
    // setStockLatestPrice(600);
    if (userId) void initPage();
  }, [userId]);
  useEffect(() => {
    if (!stockSelected) return;
    void getCandlesDataByFilter(filters[selectFilter]);
    setStockLatestPrice(stocksLatestPrice[stockSelected.nameInMarket] ?? 0);
  }, [stockSelected]);
  useEffect(() => {
    if (!userStock || !stockLatestPrice) return;
    updateCarteraDeAcciones();
  }, [userStock, stockLatestPrice]);

  const initPage = async () => {
    const res = await fetch("/api/init-page?userId=" + userId);
    const response = (await res.json()) as IInitPage;
    setStocks(response.stocks);
    setStockSelected(response.stocks[0]);
    setStocksInPossession(response.stocksInPossessions);
    setTransactions(response.transactions);
    setUserStock(response.stockUser);
    setStocksLatestPrice(response.stocksLatestPrice);
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
    if (!userStock || stocksLatestPrice.length === 0) return null;
    const costoAhora = 0; //userStock.numberOfStocks * stockLatestPrice;
    setCarteraDeAcciones({
      earn: costoAhora - userStock.totalCostOfStocks,
      total: costoAhora,
    });
  };
  const sellStock = async () => {
    if (!userStock || !userId) return;
    const cash = Number(userStock.cash) + 0; //  stocksLatestPrice * 0; //userStock.numberOfStocks;
    const [numberOfStocks, totalCostOfStocks] = [0, 0];
    setUserStock({ ...userStock, totalCostOfStocks, cash });
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
        // numberOfStocks: userStock.numberOfStocks,
        totalCostOfStocks: userStock.totalCostOfStocks,
        cash,
        userId,
      }),
    });
  };
  const buyStock = () => {
    if (!userStock || !userId || !stockSelected) return;
    if (Number(userStock.cash) - stockLatestPrice < 0)
      return alert("No tienes suficiente dinero");
    const totalCostOfStocks =
      Number(userStock.totalCostOfStocks) + stockLatestPrice;
    const cash = Number(userStock.cash) - stockLatestPrice;
    setUserStock({ ...userStock, totalCostOfStocks, cash });
    let stockInPosessionId = 0;
    let newTotalCost = 0;
    let newQuantity = 0;
    const newStocksInP: IStockInPossession[] = stocksInPossession.map((s) => {
      let { totalCost, quantity } = s;
      if (Number(s.stockId) === stockSelected.id) {
        totalCost = Number(s.totalCost) + Number(stockLatestPrice);
        newTotalCost = totalCost;
        quantity = Number(s.quantity) + 1;
        newQuantity = quantity;
        stockInPosessionId = s.id;
      }
      return { ...s, totalCost, quantity };
    });
    setStocksInPossession(newStocksInP);
    setTransactions((t) => [
      ...t,
      {
        id: new Date().getDate(),
        invested: stockLatestPrice,
        type: ETypeTransaction.COMPRA,
        stockCost: stockLatestPrice,
        stockId: String(stockSelected.id),
        userId: Number(userId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    void fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalCostOfStocks,
        cash,
        userId,
        stockLatestPrice,
        stockId: stockSelected.id,
        type: ETypeTransaction.COMPRA,
        totalCost: newTotalCost,
        quantity: newQuantity,
        stockInPosessionId,
      }),
    });
  };
  const getCandlesDataByFilter = async (date = "hoy") => {
    const res = await fetch("/api/alpaca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intervalo: date,
        stockName: stockSelected?.nameInMarket,
      }),
    });
    if (!res.ok) throw new Error(`Error en la solicitud: ${res.status}`);
    const response = (await res.json()) as { respuesta: IData[] };
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
          <div className="space-y-3">
            <div className="mb-5 flex gap-3">
              <div className="flex gap-3 rounded-xl border border-gray-200 p-4">
                <Image
                  src={
                    stockSelected?.imageUrl ??
                    "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                  }
                  width={35}
                  height={35}
                  alt="msft logo"
                />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <select
                      className="select select-xs font-bold text-gray-600"
                      onChange={async ({ target: { value: v } }) =>
                        setStockSelected(stocks.find((s) => s.id === Number(v)))
                      }
                      value={stockSelected ? stockSelected.id : 0}
                    >
                      {stocks.map((s, i) => (
                        <option key={i} value={s.id}>
                          {s.nameInMarket}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-end">
                      <span className="mr-1 pb-[0.2rem] text-xs">precio: </span>
                      <div>
                        {stockLatestPrice
                          ? stockLatestPrice.toFixed(2)
                          : "0.00"}
                        $
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <span className="ml-2 text-xs">{stockSelected?.name}</span>
                    <button
                      className="btn btn-primary btn-xs text-white"
                      onClick={buyStock}
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
                <div className="font-bold text-gray-600">
                  Cartera de Acciones
                </div>
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
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
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
                  {!userStock ? "0.00" : Number(userStock?.cash).toFixed(2)}$
                </div>
              </div>
              <div className="ml-auto flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
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
            <div role="tablist" className="tabs-boxed tabs tabs-sm w-fit">
              <a
                role="tab"
                className={`tab ${tabSelected === 1 && "tab-active"}`}
                onClick={() => setTabSelected(1)}
              >
                Gráfico
              </a>
              <a
                role="tab"
                className={`tab ${tabSelected === 2 && "tab-active"}`}
                onClick={() => setTabSelected(2)}
              >
                Historial
              </a>
              <a
                role="tab"
                className={`tab ${tabSelected === 3 && "tab-active"}`}
                onClick={() => setTabSelected(3)}
              >
                Cartera
              </a>
              <a
                role="tab"
                className={`tab ${tabSelected === 4 && "tab-active"}`}
                onClick={() => setTabSelected(4)}
              >
                Simulación
              </a>
            </div>
            <div className="flex gap-3">
              <div className="w-full">
                {tabSelected === 1 && (
                  <>
                    <div className="h-[50vh] rounded-xl border border-gray-200">
                      <ChartDynamic
                        options={data.options as unknown as ApexOptions}
                        data={
                          [
                            { data: candlesData },
                          ] as unknown as ApexAxisChartSeries
                        }
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      <p className="text-sm">Filtros de fecha: </p>
                      {filters.map((f, idx) => (
                        <button
                          key={idx}
                          className="btn btn-primary btn-xs border text-white"
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
                  </>
                )}
                {tabSelected === 2 && (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="h-[50vh] overflow-x-auto">
                      <table className="table table-zebra table-pin-rows table-xs">
                        <thead>
                          <tr>
                            <th>Acción</th>
                            <th>Tipo</th>
                            <th>$ Invertido</th>
                            <th>Cantidad</th>
                            <th>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((t, i) => (
                            <tr key={i}>
                              <td>
                                <StockTableColumn
                                  stock={stocks.find(
                                    (s) => s.id === Number(t.stockId),
                                  )}
                                />
                              </td>
                              <td
                                className={`font-bold ${
                                  t.type === ETypeTransaction.VENTA
                                    ? "text-red-500"
                                    : "text-green-500"
                                }`}
                              >
                                {t.type.toUpperCase()}
                              </td>
                              <td>$ {t.stockCost}</td>
                              <td>{t.invested / t.stockCost}</td>
                              <td>
                                {t.createdAt
                                  .replace("T", " ")
                                  .replace(/\:\d{2}\.\d{3}Z$/, "")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {tabSelected === 3 && (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="h-[50vh] overflow-x-auto">
                      <table className="table table-zebra table-pin-rows table-xs">
                        <thead>
                          <tr>
                            <th>Acción</th>
                            <th>Ganancia</th>
                            <th>Invertido $</th>
                            <th>Cantidad</th>
                            <th>Vender</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stocksInPossession.map((p, i) => (
                            <tr key={i}>
                              <td>
                                <StockTableColumn
                                  stock={stocks.find(
                                    (s) => s.id === Number(p.stockId),
                                  )}
                                />
                              </td>
                              <StockGanancia
                                quantity={p.quantity}
                                stock={stocks.find(
                                  (s) => s.id === Number(p.stockId),
                                )}
                                stocksLatestPrice={stocksLatestPrice}
                                totalCost={p.totalCost}
                              />
                              <td>{Number(p.totalCost).toFixed(2)}$</td>
                              <td>{p.quantity}</td>
                              <td>
                                <button className="btn btn-primary btn-xs">
                                  -
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {tabSelected === 4 && (
                  <div className="h-[50vh] rounded-xl border border-gray-200">
                    <div>Aqui está la simiulación</div>
                  </div>
                )}
              </div>
              <div className="h-[50vh] w-4/12 rounded-xl border border-gray-200">
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

// TODO:
// verificar que tengas más de lo que cueste el stock
