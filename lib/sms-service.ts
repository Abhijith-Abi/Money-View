import twilio from "twilio";

/**
 * SMS Service using Twilio
 * 
 * Required environment variables in .env.local:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER (The Twilio number to send from)
 */

interface SmsResult {
    success: boolean;
    phone: string;
    error?: string;
    messageSid?: string;
}

/**
 * Normalizes a phone number to E.164 format (e.g., +919876543210)
 * Defaults to Indian country code (+91) if 10 digits are provided.
 */
function normalizePhone(phone: string): string {
    // 1. Strip everything except digits
    let digits = phone.replace(/\D/g, "");
    
    // 2. Handle Indian numbers (+91 / 91 prefix)
    if (digits.length === 12 && digits.startsWith("91")) {
        return `+${digits}`;
    }
    
    // 3. If it's already 10 digits, assume it's an Indian number and add +91
    if (digits.length === 10) {
        return `+91${digits}`;
    }

    // 4. If it's already prefixed with something else, just add the +
    if (digits.length > 10) {
        return `+${digits}`;
    }
    
    return digits; // Fallback for invalid formats
}

/**
 * Get Twilio client instance
 */
function getTwilioClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
        return null;
    }

    return {
        client: twilio(accountSid, authToken),
        fromNumber
    };
}

/**
 * Send an SMS to a single phone number via Twilio.
 */
export async function sendSms(phone: string, message: string): Promise<SmsResult> {
    const config = getTwilioClient();

    if (!config) {
        console.warn("[SMS] Twilio credentials not fully configured — skipping SMS to", phone);
        return { success: false, phone, error: "Twilio not configured" };
    }

    const to = normalizePhone(phone);
    if (!to.startsWith("+") || to.length < 12) {
        return { success: false, phone, error: "Invalid phone number format" };
    }

    try {
        const result = await config.client.messages.create({
            body: message,
            from: config.fromNumber,
            to: to
        });

        console.log(`[SMS] ✅ Twilio Sent to: ${to} | SID: ${result.sid}`);
        return { success: true, phone, messageSid: result.sid };
    } catch (err: any) {
        console.error("[SMS] ❌ Twilio error:", err.message);
        return { success: false, phone, error: err.message };
    }
}

/**
 * Send SMS to multiple phone numbers. Returns counts of successes and failures.
 * Uses Promise.all for concurrent sending.
 */
export async function sendSmsToMany(
    phones: string[],
    message: string
): Promise<{ smsSentCount: number; smsFailedCount: number }> {
    if (phones.length === 0) return { smsSentCount: 0, smsFailedCount: 0 };

    const config = getTwilioClient();
    if (!config) {
        console.warn("[SMS] Twilio credentials not set — skipping bulk SMS");
        return { smsSentCount: 0, smsFailedCount: phones.length };
    }

    console.log(`[SMS] Sending via Twilio to ${phones.length} number(s)`);

    const results = await Promise.all(
        phones.map(phone => sendSms(phone, message))
    );

    const smsSentCount = results.filter(r => r.success).length;
    const smsFailedCount = results.length - smsSentCount;

    return { smsSentCount, smsFailedCount };
}
