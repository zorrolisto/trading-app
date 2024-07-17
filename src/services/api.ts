export async function getResponseWithImage(message: string) {
    const res = await fetch("/api/chat/withImages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message,
        })
    })
    const data = await res.json() as { message: string }
    if (!res.ok) {
        throw new Error(data.message)
    }
    return data.message
}