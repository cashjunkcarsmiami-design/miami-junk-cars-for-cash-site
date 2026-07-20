export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const params = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));

  if (params.get("bot-field")) {
    res.writeHead(303, { Location: "/thank-you.html" });
    res.end();
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    res.end("Missing RESEND_API_KEY");
    return;
  }

  const to = process.env.CONTACT_TO_EMAIL || "cashjunkcarsmiami@gmail.com";
  const from = process.env.CONTACT_FROM_EMAIL || "Website Leads <onboarding@resend.dev>";
  const subjectPrefix = process.env.CONTACT_SUBJECT_PREFIX || "Miami Junk Cars Lead";
  const phone = params.get("phone") || params.get("Phone") || params.get("Phone Number") || "";
  const name = params.get("name") || params.get("Full Name") || params.get("First Name") || "New lead";
  const subject = `${subjectPrefix}: ${name}${phone ? ` - ${phone}` : ""}`;

  const rows = [];
  for (const [key, value] of params.entries()) {
    if (key === "redirect" || key === "bot-field" || key === "form-name") continue;
    if (!value) continue;
    rows.push(`${key}: ${value}`);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: rows.join("\n")
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    res.statusCode = 502;
    res.end(`Email failed: ${errorText}`);
    return;
  }

  const redirect = params.get("redirect") || "/thank-you.html";
  res.writeHead(303, { Location: redirect });
  res.end();
}
