// File: main.ts
import { PDFDocument, StandardFonts } from "https://cdn.skypack.dev/pdf-lib";
import { ConnectConfigWithAuthentication, SmtpClient } from "https://deno.land/x/smtp/mod.ts";
import { openKv } from "https://deno.land/x/kv@0.1.1/mod.ts";
import { KoFiData } from "./KoFiData.dto.ts";
import { SendConfig } from "https://deno.land/x/smtp@v0.7.0/config.ts";

const kv = await openKv();

async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await req.json();
  const data: KoFiData = body;

  // Fortlaufende Belegnummer holen & erhöhen
  const belegKey = ["belegnummer", new Date().getFullYear()];
  const counter = (await kv.get<number>(belegKey)).value ?? 0;
  const belegNummer = `EB-${new Date().getFullYear()}-${String(counter + 1).padStart(3, "0")}`;
  await kv.set(belegKey, counter + 1);

  // PDF erstellen
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

  // PDF als Attachment per Mail versenden
  const client = new SmtpClient();
  await client.connect({
    hostname: "smtp.yourhost.com",
    port: 465,
    username: "your@email.com",
    password: "yourPassword",
  });

  await client.send({
    from: "noreply@codelution.de",
    to: "rechnungseingang@codelution.de",
    subject: `Spendenbeleg Eigenbeleg ${belegNummer}`,
    content: "Im Anhang finden Sie Ihren Eigenbeleg.",
    attachments: [
      {
        content: pdfBytes,
        filename: `KoFi-${belegNummer}.pdf`,
        contentType: "application/pdf",
      },
    ],
  });

  await client.close();

  return new Response(`Beleg ${belegNummer} erstellt und versendet.`, {
    status: 200,
  });
}

Deno.serve(handler);



