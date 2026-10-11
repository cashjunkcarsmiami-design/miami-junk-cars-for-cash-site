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

  const reject = (status, message) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quote request</title><main><h1>We could not send your request.</h1><p>${message}</p><p>Use your browser's Back button to correct your details and try again, or call <a href="tel:+13053164221">(305) 316-4221</a>.</p></main></html>`);
  };
  const submittedPhone = (params.get("phone") || params.get("Phone") || params.get("Phone Number") || "").trim();
  const digits = submittedPhone.replace(/\D/g, "");
  if (!/^[+0-9\s().-]+$/.test(submittedPhone) || !(digits.length === 10 || (digits.length === 11 && digits.startsWith("1")))) {
    reject(400, "Please enter a valid 10-digit phone number, optionally with country code 1.");
    return;
  }
  const detailedFields = ["Make", "Model", "Year", "Vehicle Damage", "Vehicle Location"];
  const detailed = detailedFields.some(field => params.has(field));
  const requiredFields = detailed ? detailedFields : ["First Name"];
  for (const field of requiredFields) {
    if (!params.get(field)?.trim()) { reject(400, "Please complete all required vehicle details."); return; }
  }
  const year = Number(params.get("Year"));
  if (params.has("Year") && (!Number.isInteger(year) || year < 1900 || year > new Date().getUTCFullYear() + 1)) {
    reject(400, "Please enter a valid vehicle year."); return;
  }
  const email = params.get("Email")?.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    reject(400, "Please correct your email address or leave the optional email field empty."); return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    reject(503, "The quote service is temporarily unavailable. Please call us.");
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

  let response;
  try { response = await fetch("https://api.resend.com/emails", {
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

  } catch { reject(502, "The email service is temporarily unavailable. Please try again or call us."); return; }

  if (!response.ok) {
    reject(502, "The email service could not accept your request. Please try again or call us.");
    return;
  }

  const requestedRedirect = params.get("redirect") || "/thank-you.html";
  const redirect = /^\/(?!\/)[A-Za-z0-9/_-]+(?:\.html)?$/.test(requestedRedirect) ? requestedRedirect : "/thank-you.html";
  res.writeHead(303, { Location: redirect });
  res.end();
}
