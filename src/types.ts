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
export interface IMensaje {
  orden: number;
  text: string;
  remitente: ERemitente;
}
export interface IStock {
  id: number;
  userId: number;
  cash: number;
  costOfStock: null | number;
  createdAt: Date;
  updatedAt: Date;
}
