import { readFileSync } from "fs";
import path from "path";

export async function GET() {
    const filepath = path.resolve('.', "src/app/api/images/trades.jpeg");
    const imageBuffer = readFileSync(filepath)
    return new Response(imageBuffer, {
        headers: {
            "Content-Type": "image/jpeg"
        }
    })
}