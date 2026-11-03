const TOKEN_URL = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
const STK_URL = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

// Sandbox defaults
const SHORTCODE = "174379";
const PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

function cors(status, body) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    },
    body: JSON.stringify(body)
  };
}

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  );
}

function normalizePhone(phone) {
  let p = String(phone || "").replace(/\s+/g, "").replace(/^\+/, "");
  if (p.startsWith("0")) p = "254" + p.slice(1);
  if (p.startsWith("7") && p.length === 9) p = "254" + p;
  if (!/^2547\d{8}$/.test(p)) return null;
  return p;
}

async function getToken(key, secret) {
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    headers: { Authorization: `Basic ${auth}` }
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.errorMessage || "No access token");
  return data.access_token;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors(200, { ok: true });
  if (event.httpMethod !== "POST") return cors(405, { error: "POST only" });

  try {
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    if (!key || !secret) {
      return cors(500, { error: "Missing MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET on Netlify" });
    }

    const body = JSON.parse(event.body || "{}");
    const amount = Math.round(Number(body.amount));
    const phone = normalizePhone(body.phone);
    const accountRef = String(body.accountRef || "Sale").slice(0, 12);
    const description = String(body.description || "Payment").slice(0, 13);

    if (!phone) return cors(400, { error: "Invalid phone. Use 07XXXXXXXX" });
    if (!amount || amount < 1) return cors(400, { error: "Invalid amount" });

    const site = process.env.URL || process.env.DEPLOY_PRIME_URL || "";
    const callbackUrl = `${site.replace(/\/$/, "")}/.netlify/functions/mpesa-callback`;

    const ts = timestamp();
    const password = Buffer.from(SHORTCODE + PASSKEY + ts).toString("base64");
    const token = await getToken(key, secret);

    const payload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: accountRef,
      TransactionDesc: description
    };

    const res = await fetch(STK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.ResponseCode !== "0" && data.ResponseCode !== 0) {
      return cors(400, {
        error: data.errorMessage || data.CustomerMessage || "STK push failed",
        raw: data
      });
    }

    return cors(200, {
      ok: true,
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      customerMessage: data.CustomerMessage
    });
  } catch (err) {
    return cors(500, { error: err.message || "Server error" });
  }
};