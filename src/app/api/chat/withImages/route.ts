import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { type ISimulationHTMLs } from "~/types";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import path from "path";

interface dataReq {
    message: string;
    context: ISimulationHTMLs;
}

export async function POST(req: Request) {
    const { message } = await req.json() as dataReq;
    try {
        const plot = path.resolve(process.cwd(), "src/app/api/images/plot.jpeg");
        const trades = path.resolve(process.cwd(), "src/app/api/images/trades.jpeg");
        const result = await generateText({
            model: openai("gpt-4o"),
            system: "describe the grafics in the iamges",
            messages: [
                {
                    role:"user",
                    content: [
                        {
                            type:"image",
                            image: readFileSync(plot)
                        },
                        {
                            type:"image",
                            image: readFileSync(trades)
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