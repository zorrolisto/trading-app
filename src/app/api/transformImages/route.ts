import { NextResponse } from "next/server";
import nodeHtmlToImage from "node-html-to-image";
import { type ISimulationHTMLs } from "~/types";

export async function POST(req: Request) {
    const { htmls } = await req.json() as { htmls: ISimulationHTMLs };
    try {
        await nodeHtmlToImage({
            output: "src/app/api/images/plot.jpeg",
            html: htmls.plot_content,
        })
        await nodeHtmlToImage({
            output: "src/app/api/images/trades.jpeg",
            html: htmls.trades_content,
        })
    return NextResponse.json({
        message: "success"
    })
    } catch (error) {
        console.error(error)
        return NextResponse.json({
            message: "error"  
        }, { status: 500 })
    }
}