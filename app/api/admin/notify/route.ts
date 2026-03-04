import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { sendSmsToMany } from "@/lib/sms-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    let body: {
        title?: string;
        body?: string;
        image?: string;
        extraPhones?: string[];
    };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
        );
    }

    const { title, body: messageBody, image, extraPhones = [] } = body;

    if (!title || !messageBody) {
        return NextResponse.json(
            { error: "title and body are required" },
            { status: 400 }
        );
    }

    const results = {
        success: true,
        smsSentCount: 0,
        smsFailedCount: 0,
        error: null as string | null,
    };

    try {
        const smsMessage = `${title}\n${messageBody}`;

        const allPhones = [...new Set(extraPhones.filter((p) => p.trim()))];
        if (allPhones.length > 0) {
            console.log(`[notify] Sending SMS to ${allPhones.length} numbers via Twilio...`);
            const { smsSentCount, smsFailedCount } = await sendSmsToMany(allPhones, smsMessage);
            results.smsSentCount = smsSentCount;
            results.smsFailedCount = smsFailedCount;
        }

        return NextResponse.json(results);
    } catch (error: any) {
        console.error("[/api/admin/notify] Global error:", error);
        return NextResponse.json(
            { error: "Internal server error: " + error.message },
            { status: 500 }
        );
    }
}
