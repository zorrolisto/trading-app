import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";

interface dataReq {
    message: string;
    context: { plot: string, trades: string };
}

export async function POST(req: Request) {
    const { message, context } = await req.json() as dataReq;
    try {
        const result = await generateText({
            model: openai("gpt-4o"),
            system: "describe the grafics in the iamges",
            messages: [
                {
                    role:"user",
                    content: [
                        {
                            type:"image",
                            image: context.plot
                        },
                        {
                            type:"image",
                            image: context.trades
                        },
                        {
                            type:"text",
                            text:message
                        }
                    ]
                }
            ]
        })
        return NextResponse.json({
            message: result.text
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({
            message: "error"  
        }, { status: 500 })
    }
}