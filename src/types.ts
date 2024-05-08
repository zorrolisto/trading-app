export interface IData {
  timestamp: string;
  open: number;
  low: number;
  high: number;
  close: number;
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
