/**
 * SMS Service using Fast2SMS (free tier available at fast2sms.com)
 * Set FAST2SMS_API_KEY in your .env.local to activate SMS sending.
 */

const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

interface SmsResult {
    success: boolean;
    phone: string;
    error?: string;
}

/**
 * Send an SMS to a single phone number via Fast2SMS Quick SMS.
 * Phone should be a 10-digit Indian mobile number (no country code).
 */
export async function sendSms(phone: string, message: string): Promise<SmsResult> {
    const apiKey = process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
        console.warn("[SMS] FAST2SMS_API_KEY not set — skipping SMS to", phone);
        return { success: false, phone, error: "API key not configured" };
    }

    // Normalize: strip leading +91 or 91 prefix, keep 10 digits
    const cleaned = phone.replace(/^\+?91/, "").replace(/\D/g, "").slice(-10);
    if (cleaned.length !== 10) {
        return { success: false, phone, error: "Invalid phone number (must be 10 digits)" };
    }

    try {
        const res = await fetch(FAST2SMS_URL, {
            method: "POST",
            headers: {
                authorization: apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                route: "q",           // Quick SMS route (no DLT template required for transactional)
                message,
                language: "english",
                flash: 0,
                numbers: cleaned,
            }),
        });

        const data = await res.json();

        if (data.return === true) {
            return { success: true, phone: cleaned };
        } else {
            console.error("[SMS] Fast2SMS error for", cleaned, data);
            return { success: false, phone: cleaned, error: JSON.stringify(data) };
        }
    } catch (err: any) {
        console.error("[SMS] Network error for", cleaned, err);
        return { success: false, phone: cleaned, error: err.message };
    }
}

/**
 * Send SMS to multiple phone numbers. Returns counts of successes and failures.
 */
export async function sendSmsToMany(
    phones: string[],
    message: string
): Promise<{ smsSentCount: number; smsFailedCount: number }> {
    if (phones.length === 0) return { smsSentCount: 0, smsFailedCount: 0 };

    // Fast2SMS supports comma-separated numbers in one call — use that for efficiency
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
        console.warn("[SMS] FAST2SMS_API_KEY not set — skipping bulk SMS");
        return { smsSentCount: 0, smsFailedCount: phones.length };
    }

    // Normalize all numbers
    const cleaned = phones
        .map((p) => p.replace(/^\+?91/, "").replace(/\D/g, "").slice(-10))
        .filter((p) => p.length === 10);

    if (cleaned.length === 0) return { smsSentCount: 0, smsFailedCount: phones.length };

    try {
        const res = await fetch(FAST2SMS_URL, {
            method: "POST",
            headers: {
                authorization: apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                route: "q",
                message,
                language: "english",
                flash: 0,
                numbers: cleaned.join(","),
            }),
        });

        const data = await res.json();

        if (data.return === true) {
            console.log(`[SMS] Bulk sent to ${cleaned.length} numbers`);
            return { smsSentCount: cleaned.length, smsFailedCount: phones.length - cleaned.length };
        } else {
            console.error("[SMS] Bulk send error:", data);
            return { smsSentCount: 0, smsFailedCount: phones.length };
        }
    } catch (err: any) {
        console.error("[SMS] Bulk network error:", err);
        return { smsSentCount: 0, smsFailedCount: phones.length };
    }
}
