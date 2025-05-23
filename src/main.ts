import {
  PDFDocument,
  StandardFonts,
} from 'https://cdn.skypack.dev/pdf-lib@^1.11.1?dts';
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

import { KoFiData } from "./KoFiData.dto.ts";

const kv = await Deno.openKv();

async function nextBelegnummer(): Promise<string> {
  const last = (await kv.get<number>(["lastBelegnummer"])).value ?? 0;
  const next = last + 1;
  await kv.set(["lastBelegnummer"], next);
  return `SPENDE-${new Date().getFullYear()}-${String(next).padStart(3, "0")}`;
}

async function createPdf(data: KoFiData, belegNummer: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // DIN A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const drawText = (text: string, x: number, y: number) => {
    page.drawText(text, {
      x,
      y,
      size: 12,
      font,
    });
  };

  const yStart = 800;
  drawText("Eigenbeleg", 50, yStart);
  drawText(`Belegnummer: ${belegNummer}`, 50, yStart - 20);
  drawText(`Datum: ${new Date(data.timestamp).toLocaleDateString("de-DE")}`, 50, yStart - 40);
  drawText(`Betrag: ${data.amount} ${data.currency}`, 50, yStart - 60);
  drawText(`Geber: ${data.from_name || "Anonym"}`, 50, yStart - 80);
  drawText(`Nachricht: ${data.message || "-"}`, 50, yStart - 100);

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

function createPdfDownloadLink(req: Request, belegNummer: string) {
  const url = new URL(req.url);
  const host = req.headers.get("host");
  const prot = url.protocol === "https:" || url.hostname === "localhost" ? "https" : "http";
  const belegUrl = `${prot}://${host}/beleg?id=${belegNummer}`;
  return belegUrl
}

async function sendEmail(belegNummer: string, downloadLink: string): Promise<void> {
  const client = new SmtpClient();
  await client.connect({
    hostname: Deno.env.get("SMTP_HOSTNAME") ?? "",
    port: Number(Deno.env.get("SMTP_PORT") ?? "465"),
    username: Deno.env.get("SMTP_USERNAME") ?? "",
    password: Deno.env.get("SMTP_PASSWORD") ?? "",
  });

  await client.send({
    from: Deno.env.get("EMAIL_SENDER") ?? "",
    to: Deno.env.get("EMAIL_RECEIVER") ?? "",
    subject: `Spendenbeleg Nr: '${belegNummer}' erstellt`,
    content: "Es wurde ein neuer Spendenbeleg erstellt. Download-Link: " + downloadLink,
  });

  await client.close();
}

async function savePdf(belegNummer: string, pdfBytes: Uint8Array) {
  await kv.set(["pdf", belegNummer], pdfBytes);
}


async function handler(req: Request): Promise<Response> {
  if (req.method === "POST") {
    let bodyText = await req.text();
    // bodyText is application/x-www-form-urlencoded
    // decode and parse the data propertys value as json
    const body = new URLSearchParams(bodyText);
    const data: KoFiData = JSON.parse(body.get("data") || "{}");

    const belegNummer = await nextBelegnummer();
    const pdfBytes = await createPdf(data, belegNummer);
    await savePdf(belegNummer, pdfBytes);
    const downloadLink = createPdfDownloadLink(req, belegNummer);
    await sendEmail(belegNummer, downloadLink); 
    
    return new Response(`Beleg ${belegNummer} erstellt und versendet.`, { status: 200 });
  }

  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.pathname !== "/beleg") return new Response("Not Found", { status: 404 });

    const id = url.searchParams.get("id");
    if (!id) return new Response("Missing ID", { status: 400 });

    const result = await kv.get<Uint8Array>(["pdf", id]);
    if (!result.value) return new Response("Beleg nicht gefunden", { status: 404 });

    return new Response(result.value, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=Beleg-${id}.pdf`,
      },
    });
  }

  return new Response("Method not supported", { status: 405 });
}

Deno.serve(handler);