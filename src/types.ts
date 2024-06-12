export interface IData {
  Timestamp: string;
  OpenPrice: number;
  LowPrice: number;
  HighPrice: number;
  ClosePrice: number;
}
export interface ICandle {
  x: Date;
  y: number[];
}
export const enum ERemitente {
  MAQUINA = "ai",
  PERSONA = "human",
}
export const enum ETypeTransaction {
  COMPRA = "Compra",
  VENTA = "Venta",
}
export interface IMensaje {
  orden: number;
  text: string;
  remitente: ERemitente;
}
interface IBase {
  id: number;
  createdAt: string;
  updatedAt: string;
}
export interface IStockInPossession extends IBase {
  stockId: string;
  totalCost: number;
  quantity: number;
}
export interface IStock extends IBase {
  nameInMarket: string;
  name: string;
  imageUrl: string;
}
export interface ITransaction extends IBase {
  invested: number;
  stockCost: number;
  type: ETypeTransaction;
  stockId: string;
  userId: number;
}
export interface IStockUser extends IBase {
  userId: number;
  cash: number;
  totalCostOfStocks: number;
}
export interface IInitPage {
  stocks: IStock[];
  stockUser: IStockUser;
  transactions: ITransaction[];
  stocksInPossessions: IStockInPossession[];
  stocksLatestPrice: Record<string, number>;
}
