import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import nodeHtmlToImage from "node-html-to-image";
import path from "path";
import { type ISimulationHTMLs } from "~/types";

export async function POST(req: Request) {
    const { htmls } = await req.json() as { htmls: ISimulationHTMLs };
    const plot = path.resolve(process.cwd(), "src/app/api/images/plot.jpeg");
    const trades = path.resolve(process.cwd(), "src/app/api/images/trades.jpeg");
    try {
        await nodeHtmlToImage({
            output: plot,
            html: htmls.plot_content,
        })
        await nodeHtmlToImage({
            output: trades,
            html: htmls.trades_content,
        })
    
    return NextResponse.json({
        message: {
            plot: readFileSync(plot).toString("base64"),
            trades: readFileSync(trades).toString("base64"),
        }
    })
    } catch (error) {
        console.error(error)
        return NextResponse.json({
            message: "error"  
        }, { status: 500 })
    }
}