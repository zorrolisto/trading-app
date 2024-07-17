"use client";

import React, { useState } from 'react'
import { defaultMessages } from '~/constants';
import { getResponseWithImage } from '~/services/api';
import { ERemitente, type IMensaje } from '~/types';
import image from '../api/images/trades.jpeg';

function ChatImage() {
    const [mensajes, setMensajes] = useState<IMensaje[]>([]);
    const [loadingResponse, setLoadingResponse] = useState(false);
    const [inputChat, setInputChat] = useState("");
    
    const handleSubmit= (e:  React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
       setLoadingResponse(true);
       const nerMessajes = [
        ...mensajes,
        {
          orden: mensajes.length + 1,
          text: inputChat,
          remitente: ERemitente.PERSONA,
        },
       ]
        setMensajes(nerMessajes);
        void getResponseWithImage(inputChat).then((response) => {
            const newMessages = [
                ...nerMessajes,
                {
                    orden: nerMessajes.length + 1,
                    text: response,
                    remitente: ERemitente.MAQUINA,
                }
            ]
            setMensajes(newMessages);
            setInputChat("");
            setLoadingResponse(false);
        }).catch((error) => {
            setLoadingResponse(false);
            console.error(error)
        })
    }
    return (
    <form onSubmit={handleSubmit} className=" h-full rounded-xl border border-gray-200">
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
        <div
            className={
                "chat chat-end"
            }
            >
            <div
                className={
                "chat-bubble text-sm text-white chat-bubble-info"
                }
            >
                Simulación actual
                <img className='h-40' src={image.src} alt='simulation' loading="lazy" />
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

export default ChatImage