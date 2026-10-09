/**
 * SMS sending via Twilio's REST API (plain fetch, no SDK).
 *
 * Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 * (TWILIO_PHONE_NUMBER is accepted as a legacy alias for the from-number).
 * When any are missing, isSmsConfigured() is false and SMS notifications
 * stay queued — nothing fails, nothing sends.
 */

export function smsFromNumber(): string {
  return process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER || "";
}

export function isSmsConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    smsFromNumber()
  );
}

export class SmsError extends Error {}

/**
 * Send one SMS. Throws SmsError on any failure (auth, validation, network,
 * or a non-2xx Twilio response).
 */
export async function sendSms(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = smsFromNumber();
  if (!sid || !token || !from) {
    throw new SmsError("Twilio is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER).");
  }

  const credentials = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: to, From: from, Body: body });

  let res: Response;
  try {
    res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );
  } catch (e) {
    throw new SmsError(`Twilio request failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const data = (await res.json()) as { message?: string; code?: number };
      detail = data.message ? ` (${data.code ?? "?"}: ${data.message})` : "";
    } catch {
      /* non-JSON error body */
    }
    throw new SmsError(`Twilio rejected the message (HTTP ${res.status})${detail}.`);
  }
}
