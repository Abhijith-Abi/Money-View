import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const GROQ_MODELS = [
    "groq/compound-mini",
    "groq/compound",
    "openai/gpt-oss-120b",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-20b",
];

const SYSTEM_PROMPT = `You are the MoneyView AI Financial & EMI Intelligence Assistant.
You are an expert in:
1. Loan EMI calculations (Reducing Balance and Flat Rate formulas).
2. Repayment schedules, monthly interest, principal breakdown, and remaining balances.
3. Tracking money paid vs. money pending, and calculating date-wise pending and overdue months.
4. Business ledger analysis (Credits, Debits, Receivables, Payables, and Cash Flow).
5. Personal financial budgeting, income tracking, and expense optimization.

Guidelines:
- Give accurate, clear, and structured financial answers with breakdown tables or bullet points when helpful.
- For loan queries, clearly state the EMI amount, Total Interest, Total Payable, and monthly breakdown.
- Always be helpful, concise, and professional. Use Indian Rupee (₹) or standard currency formatting.`;

// Handle CORS Preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}

export async function GET() {
    return NextResponse.json({
        status: "online",
        service: "MoneyView AI / EMI Assistant",
        provider: "Groq API",
        models: GROQ_MODELS,
    });
}

export async function POST(req: NextRequest) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    try {
        let body: any = {};
        try {
            body = await req.json();
        } catch {
            body = {};
        }

        // Support various request formats: messages array, message string, prompt string, or query string
        let userMessages: Array<{ role: string; content: string }> = [];

        if (Array.isArray(body.messages) && body.messages.length > 0) {
            userMessages = body.messages.map((m: any) => ({
                role: m.role || "user",
                content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
            }));
        } else {
            const promptText =
                body.message ||
                body.prompt ||
                body.query ||
                body.text ||
                body.input ||
                "Hello, can you help me calculate my loan EMI and pending months?";

            userMessages = [{ role: "user", content: String(promptText) }];
        }

        // Ensure system prompt is present
        const hasSystem = userMessages.some((m) => m.role === "system");
        const fullMessages = hasSystem
            ? userMessages
            : [{ role: "system", content: SYSTEM_PROMPT }, ...userMessages];

        let lastError: any = null;
        let completionData: any = null;

        // Try primary and fallback models
        const modelsToTry = body.model ? [body.model, ...GROQ_MODELS] : GROQ_MODELS;

        for (const model of modelsToTry) {
            try {
                const response = await fetch(
                    "https://api.groq.com/openai/v1/chat/completions",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${GROQ_API_KEY}`,
                        },
                        body: JSON.stringify({
                            model,
                            messages: fullMessages,
                            temperature: typeof body.temperature === "number" ? body.temperature : 0.7,
                            max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 2048,
                            top_p: 0.95,
                        }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const choiceContent = data.choices?.[0]?.message?.content;
                    if (choiceContent && choiceContent.trim().length > 0) {
                        completionData = data;
                        break;
                    } else if (data.choices?.[0]?.message?.reasoning) {
                        // If reasoning is present without content
                        completionData = {
                            ...data,
                            choices: [
                                {
                                    ...data.choices[0],
                                    message: {
                                        ...data.choices[0].message,
                                        content: data.choices[0].message.reasoning,
                                    },
                                },
                            ],
                        };
                        break;
                    }
                } else {
                    const errJson = await response.json().catch(() => ({}));
                    lastError = errJson;
                    console.warn(`Model ${model} failed with status ${response.status}:`, errJson);
                }
            } catch (err: any) {
                lastError = err;
                console.warn(`Error connecting to model ${model}:`, err?.message);
            }
        }

        if (!completionData) {
            console.error("All Groq models failed. Last error:", lastError);
            return NextResponse.json(
                {
                    error: "AI service temporarily unavailable",
                    details: lastError?.error?.message || "Please verify Groq API key and connection.",
                    success: false,
                },
                { status: 500, headers: corsHeaders }
            );
        }

        let replyContent =
            completionData.choices?.[0]?.message?.content ||
            "I processed your request, but received an empty response.";

        // Strip any internal <think>...</think> tags if emitted by Qwen or reasoning models
        replyContent = replyContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        return NextResponse.json(
            {
                success: true,
                reply: replyContent,
                message: replyContent,
                content: replyContent,
                text: replyContent,
                choices: completionData.choices,
                model: completionData.model,
                usage: completionData.usage,
            },
            {
                status: 200,
                headers: corsHeaders,
            }
        );
    } catch (error: any) {
        console.error("Critical error in /api/ai route:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: error?.message || "Failed to process AI request",
                success: false,
            },
            { status: 500, headers: corsHeaders }
        );
    }
}
