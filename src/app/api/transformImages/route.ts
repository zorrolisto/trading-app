import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import nodeHtmlToImage from "node-html-to-image";
import path from "path";
import { type ISimulationHTMLs } from "~/types";

export async function POST(req: Request) {
    const { htmls } = await req.json() as { htmls: ISimulationHTMLs };
    const plot = path.resolve(__dirname, "plot.jpeg");
    const trades = path.resolve(__dirname, "trades.jpeg");
    try {
        const resPlot = await nodeHtmlToImage({
            output: plot,
            html: htmls.plot_content, 
        })
        const resTrade = await nodeHtmlToImage({
            output: trades,
            html: htmls.trades_content,
        })
    
    return NextResponse.json({
        message: {
            plot: resPlot.toString("base64"),
            trades: resTrade.toString("base64"),
        }
    })
    } catch (error) {
        console.error(error)
        return NextResponse.json({
            message: "error"  
        }, { status: 500 })
    }
}