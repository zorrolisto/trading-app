"use client";

import { SignedOut, SignedIn } from "@clerk/nextjs";
import type { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import { data } from "~/constants";
import {
  type IData,
  type ICandle,
  type IStock,
  type IStockUser,
  type IStockInPossession,
  type ITransaction,
  type IInitPage,
  ETypeTransaction,
  type ISimulationHTMLs,
  type ISimulateForm,
} from "~/types";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import ManualDeUsuario from "./components/ManualDeUsuario";
import Simulation from "./components/Simulation";
import ChatComponet from "./components/ChatComponet";
import ChatImage from "./components/ChatImage";

const ChartDynamic = dynamic(() => import("./components/chart"), {
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
      {ganancia > 0 && "+"}
      {ganancia.toFixed(2)}$
    </td>
  );
};

const simulateFormsDefault: ISimulateForm = {
  budget: 10000,
  cash_at_risk: 0.5,
  start_date: "2023-12-01",
  end_date: "2023-12-31",
  strategy_type: "wyckoff",
};
export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [candlesData, setCandlesData] = useState<ICandle[]>([]);
  const [selectFilter, setSelectFilter] = useState(0);
  const [tabSelected, setTabSelected] = useState(1);
  const [userStock, setUserStock] = useState<IStockUser | null>(null);
  const [stocks, setStocks] = useState<IStock[]>([]);
  const [simulateForms, setSimulateForms] = useState(simulateFormsDefault);
  const [stockSelected, setStockSelected] = useState<IStock>();
  const [stocksInPossession, setStocksInPossession] = useState<
    IStockInPossession[]
  >([]);
  const [shitch, setShitch] = useState(false);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [stocksLatestPrice, setStocksLatestPrice] = useState<
    Record<string, number>
  >({});
  const [simulationHtmls, setSimulationHtmls] = useState<ISimulationHTMLs>();
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

  const initPage = async () => {
    setIsLoading(true);
    const res = await fetch("/api/init-page?userId=" + userId);
    const response = (await res.json()) as IInitPage;
    console.log("response");
    console.log(response);
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

  const sellStock = async (p: IStockInPossession) => {
    if (!userStock || !userId || !stockSelected) return;
    const stock = stocks.find((s) => s.id === Number(p.stockId));
    const stockLatestPriceOfP =
      stocksLatestPrice[stock?.nameInMarket ?? ""] ?? 0;
    const cash = Number(userStock.cash) + stockLatestPriceOfP * p.quantity;
    const totalCostOfStocks = userStock.totalCostOfStocks - p.totalCost;
    setUserStock({ ...userStock, totalCostOfStocks, cash });
    const newStocksInP: IStockInPossession[] = stocksInPossession.map((s) => {
      let { totalCost, quantity } = s;
      if (s.id === p.id) {
        totalCost = 0;
        quantity = 0;
      }
      return { ...s, totalCost, quantity };
    });
    setStocksInPossession(newStocksInP);
    setTransactions((t) => [
      {
        id: new Date().getDate(),
        invested: stockLatestPriceOfP * p.quantity,
        type: ETypeTransaction.VENTA,
        stockCost: stockLatestPriceOfP,
        stockId: p.stockId,
        userId: Number(userId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...t,
    ]);
    await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalCostOfStocks,
        cash,
        userId,
        stockLatestPrice: stockLatestPriceOfP,
        invested: stockLatestPriceOfP * p.quantity,
        stockId: p.stockId,
        type: ETypeTransaction.VENTA,
        totalCost: 0,
        quantity: 0,
        stockInPosessionId: p.id,
      }),
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
      ...t,
    ]);
    void fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalCostOfStocks,
        cash,
        userId,
        stockLatestPrice,
        invested: stockLatestPrice,
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
    setIsLoading(false);
  };
  const makeSimulation = async () => {
    setIsLoading(true);
    const url =
      process.env.NEXT_PUBLIC_CHATBOT_API +
      `/simulation?start_date=${encodeURIComponent(
        simulateForms.start_date,
      )}&end_date=${encodeURIComponent(simulateForms.end_date)}&symbol=${stockSelected?.nameInMarket
      }&cash_at_risk=${encodeURIComponent(
        simulateForms.cash_at_risk.toString(),
      )}&strategy_type=${encodeURIComponent(
        simulateForms.strategy_type.toString(),
      )}&budget=${encodeURIComponent(simulateForms.budget.toString())}`;
    const res = await fetch(url);
    const response = (await res.json()) as ISimulationHTMLs;
    // console.log("response");
    // console.log(response);
    const data = await fetch("/api/transformImages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        htmls: response
      }),
    })
    console.log(await data.json())
    setSimulationHtmls(response);
    const element: { showModal: () => 0 } = document?.getElementById(
      "my_modal_3",
    ) as unknown as {
      showModal: () => 0;
    };
    element.showModal();
    setShitch(true);
    setIsLoading(false);
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
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-screen items-center justify-center bg-black/80">
            <h1 className="text-xl font-medium text-white">Cargando...</h1>
          </div>
        )}
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
                <div className="font-bold text-gray-600">Total Invertido</div>
                <div className="flex items-center">
                  {Number(userStock?.totalCostOfStocks ?? 0).toFixed(2)}$
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
                style={{
                  color: tabSelected === 1 ? "white" : "black",
                }}
                onClick={() => setTabSelected(1)}
              >
                Gráfico
              </a>
              <a
                role="tab"
                className={`tab ${tabSelected === 2 && "tab-active"}`}
                style={{
                  color: tabSelected === 2 ? "white" : "black",
                }}
                onClick={() => setTabSelected(2)}
              >
                Historial
              </a>
              <a
                role="tab"
                className={`tab ${tabSelected === 3 && "tab-active"}`}
                style={{
                  color: tabSelected === 3 ? "white" : "black",
                }}
                onClick={() => setTabSelected(3)}
              >
                Cartera
              </a>
              <a
                role="tab"
                className={`tab ${tabSelected === 4 && "tab-active font-medium"}`}
                style={{
                  color: tabSelected === 4 ? "white" : "black",
                }}
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
                    <div className="mt-10 flex items-center gap-1">
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
                              <td>{t.type}</td>
                              <td>$ {t.invested}</td>
                              <td>{(t.invested / t.stockCost).toFixed(0)}</td>
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
                            <th>Acciones</th>
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
                                <button
                                  className="btn btn-primary btn-xs"
                                  onClick={() => sellStock(p)}
                                >
                                  Vender todo
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
                    <div className="ml-4 grid grid-cols-2 gap-2">
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-xs font-medium text-gray-500">
                            Cash Total
                          </span>
                        </div>
                        <input
                          type="number"
                          step="1000"
                          value={simulateForms.budget}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value < 0) {
                              alert("El Cash Total debe ser un número positivo.");
                              return;
                            }
                            setSimulateForms({
                              ...simulateForms,
                              budget: value,
                            });
                          }}
                          placeholder="Type here"
                          className="input input-sm input-bordered w-full max-w-xs"
                        />
                      </label>
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-xs font-medium text-gray-500">
                            Perdida máxima (0.0 a 1.0)
                          </span>
                        </div>
                        <input
                          value={simulateForms.cash_at_risk}
                          onChange={(e) =>
                            setSimulateForms({
                              ...simulateForms,
                              cash_at_risk: Number(e.target.value),
                            })
                          }
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          placeholder="Type here"
                          className="input input-sm input-bordered w-full max-w-xs"
                        />
                      </label>
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-xs font-medium text-gray-500">
                            Fecha de Inicio
                          </span>
                        </div>
                        <input
                          type="date"
                          placeholder="Type here"
                          className="input input-sm input-bordered w-full max-w-xs"
                          value={simulateForms.start_date}
                          onChange={(e) =>
                            setSimulateForms({
                              ...simulateForms,
                              start_date: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-xs font-medium text-gray-500">
                            Fecha de Fin
                          </span>
                        </div>
                        <input
                          type="date"
                          placeholder="Type here"
                          className="input input-sm input-bordered w-full max-w-xs"
                          value={simulateForms.end_date}
                          onChange={(e) =>
                            setSimulateForms({
                              ...simulateForms,
                              end_date: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-xs font-medium text-gray-500">
                            Estrategia a usar
                          </span>
                        </div>
                        <select
                          className="select select-bordered select-sm w-full max-w-xs"
                          defaultValue={simulateForms.strategy_type}
                          onChange={(e) =>
                            setSimulateForms({
                              ...simulateForms,
                              strategy_type: e.target.value as
                                | "inversion_activa"
                                | "wyckoff",
                            })
                          }
                        >
                          {["wyckoff", "inversion_activa"].map((f, idx) => (
                            <option key={idx}>{f}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="mr-4 mt-4 flex justify-end gap-2">
                      <button
                        className="btn btn-outline btn-primary btn-sm"
                        onClick={() => setSimulateForms(simulateFormsDefault)}
                      >
                        Limpiar
                      </button>
                      <button
                        className="btn btn-primary btn-sm text-white"
                        onClick={async () => {
                          if (simulateForms.budget <= 0) {
                            alert("El Cash Total debe ser un número positivo.");
                            return;
                          }
                          if (simulateForms.cash_at_risk < 0 || simulateForms.cash_at_risk > 1) {
                            alert("La Perdida máxima debe estar entre 0.0 y 1.0.");
                            return;
                          }
                          if (!simulateForms.start_date || !simulateForms.end_date) {
                            alert("Las fechas de inicio y fin no pueden estar vacías.");
                            return;
                          }
                          if (new Date(simulateForms.start_date) >= new Date(simulateForms.end_date)) {
                            alert("La fecha de fin debe ser posterior a la fecha de inicio.");
                            return;
                          }
                          try {
                            await makeSimulation();
                          } catch (error) {
                            console.error("Simulation failed", error);
                          }
                        }}
                      >
                        Simular
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="w-4/12 h-[50vh]" >
                <div className=" mb-2" >
                  <span className=" mr-5" >
                    {shitch ? "simulacion" : "agentes"}
                  </span>
                  <label className="switch">
                    <input disabled={simulationHtmls == undefined} onChange={() => { setShitch(!shitch) }} checked={shitch} type="checkbox" />
                    <span className="slider round"></span>
                  </label>
                </div>
                {
                  shitch
                    ? <ChatImage />
                    : <ChatComponet />
                }
              </div>
            </div>
          </div>
          <ManualDeUsuario />
          <Simulation simulationHtmls={simulationHtmls} />
        </div>
      </SignedIn>
    </main>
  );
}
