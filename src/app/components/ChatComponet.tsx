"use client";

import { useState } from 'react';
import { defaultMessages } from '~/constants';
import { ERemitente, type IMensaje } from '~/types'

export default function ChatComponet() {
  const [mensajes, setMensajes] = useState<IMensaje[]>([]);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [inputChat, setInputChat] = useState("");

    const getResponseFromAI = async (e:  React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoadingResponse(true);
      const mensajesWithNew = [
        ...mensajes,
        {
          orden: mensajes.length + 1,
          text: inputChat,
          remitente: ERemitente.PERSONA,
        },
      ];
      setMensajes(mensajesWithNew);
      setInputChat("");
      const res = await fetch(
        process.env.NEXT_PUBLIC_CHATBOT_API + "/agent/invoke",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: {
              input: inputChat,
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
  return (
    <form onSubmit={getResponseFromAI} className="h-full rounded-xl border border-gray-200">
    <div className="h-5/6 overflow-auto px-1.5 py-4">
      <div
          className={
            "chat " +
            (defaultMessages[0]?.remitente === ERemitente.MAQUINA
              ? "chat-start"
              : "chat-end")
          }
        >
          <div
            className={
              "chat-bubble text-sm text-white " +
              (defaultMessages[0]?.remitente === ERemitente.MAQUINA
                ? "chat-bubble-primary"
                : "chat-bubble-info")
            }
          >
            {defaultMessages[0]?.text}
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
    <div className="flex h-1/6 items-center justify-center">
      <input
        className="h-full w-full rounded-b-lg bg-gray-50 p-3 text-sm text-gray-600"
        type="text"
        placeholder="Pregunta algo..."
        onChange={(e) => setInputChat(e.target.value)}
        value={inputChat}
      />
    </div>
    {loadingResponse && (
      <div className="mt-1 w-full text-center text-xs font-bold text-primary">
        La IA está pensando...
      </div>
    )}
  </form>
  )
}