exports.handler = async (event) => {
  // Safaricom posts the payment result here.
  // For now we only accept and log; next step we update the sale in Firestore.
  try {
    const body = JSON.parse(event.body || "{}");
    console.log("M-Pesa callback:", JSON.stringify(body));
  } catch (e) {
    console.log("M-Pesa callback raw:", event.body);
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" })
  };
};