/**
 * SMS Service using Fast2SMS (fast2sms.com)
 * Uses the Developer API (route: "v3") which supports custom messages
 * without DLT template registration.
 *
 * Set FAST2SMS_API_KEY in your .env.local to activate SMS sending.
 */

const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

interface SmsResult {
    success: boolean;
    phone: string;
    error?: string;
}

/**
 * Normalizes a phone number to exactly 10 digits (strips +91 / 91 prefix)
 */
function normalizePhone(phone: string): string {
    return phone.replace(/^\+?91/, "").replace(/\D/g, "").slice(-10);
}

/**
 * Send an SMS to a single phone number via Fast2SMS Developer API.
 * Phone should be a 10-digit Indian mobile number (no country code).
 */
export async function sendSms(phone: string, message: string): Promise<SmsResult> {
    const apiKey = process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
        console.warn("[SMS] FAST2SMS_API_KEY not set — skipping SMS to", phone);
        return { success: false, phone, error: "API key not configured" };
    }

    const cleaned = normalizePhone(phone);
    if (cleaned.length !== 10) {
        return { success: false, phone, error: "Invalid phone number (must be 10 digits)" };
    }

    return sendBulkSms(apiKey, [cleaned], message, phone);
}

/**
 * Send SMS to multiple phone numbers. Returns counts of successes and failures.
 */
export async function sendSmsToMany(
    phones: string[],
    message: string
): Promise<{ smsSentCount: number; smsFailedCount: number }> {
    if (phones.length === 0) return { smsSentCount: 0, smsFailedCount: 0 };

    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
        console.warn("[SMS] FAST2SMS_API_KEY not set — skipping bulk SMS");
        return { smsSentCount: 0, smsFailedCount: phones.length };
    }

    // Normalize all numbers and filter out invalid ones
    const cleaned = phones
        .map(normalizePhone)
        .filter((p) => p.length === 10);

    if (cleaned.length === 0) {
        console.warn("[SMS] No valid phone numbers after normalization. Input phones:", phones);
        return { smsSentCount: 0, smsFailedCount: phones.length };
    }

    console.log(`[SMS] Sending to ${cleaned.length} number(s):`, cleaned);

    try {
        const result = await sendBulkSms(apiKey, cleaned, message);
        if (result.success) {
            return {
                smsSentCount: cleaned.length,
                smsFailedCount: phones.length - cleaned.length,
            };
        } else {
            return { smsSentCount: 0, smsFailedCount: phones.length };
        }
    } catch (err: any) {
        console.error("[SMS] Unexpected error:", err);
        return { smsSentCount: 0, smsFailedCount: phones.length };
    }
}

/**
 * Internal helper: send SMS to a list of 10-digit numbers using Fast2SMS Developer API (v3).
 */
async function sendBulkSms(
    apiKey: string,
    numbers: string[],
    message: string,
    originalPhone?: string
): Promise<SmsResult> {
    const numbersStr = numbers.join(",");

    const payload = {
        route: "v3",           // Developer route — no DLT template required
        sender_id: "TXTIND",   // Fast2SMS default sender for transactional messages
        message,
        language: "english",
        flash: 0,
        numbers: numbersStr,
    };

    console.log("[SMS] Sending payload:", JSON.stringify({ ...payload, apiKey: "***" }));

    try {
        const res = await fetch(FAST2SMS_URL, {
            method: "POST",
            headers: {
                authorization: apiKey,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(payload),
        });

        const text = await res.text();
        let data: any;
        try {
            data = JSON.parse(text);
        } catch {
            console.error("[SMS] Non-JSON response from Fast2SMS:", text);
            return { success: false, phone: numbersStr, error: `Non-JSON response: ${text.slice(0, 200)}` };
        }

        console.log("[SMS] Fast2SMS response:", JSON.stringify(data));

        if (data.return === true) {
            console.log(`[SMS] ✅ Sent to: ${numbersStr}`);
            return { success: true, phone: originalPhone ?? numbersStr };
        } else {
            const errMsg = data.message?.join?.(" ") ?? data.message ?? JSON.stringify(data);
            console.error("[SMS] ❌ Fast2SMS error:", errMsg, "| Full response:", JSON.stringify(data));
            return { success: false, phone: originalPhone ?? numbersStr, error: errMsg };
        }
    } catch (err: any) {
        console.error("[SMS] Network error:", err.message);
        return { success: false, phone: originalPhone ?? numbersStr, error: err.message };
    }
}
