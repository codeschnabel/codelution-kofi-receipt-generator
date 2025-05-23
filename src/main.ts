import {
  PDFDocument,
  StandardFonts,
} from 'https://cdn.skypack.dev/pdf-lib@^1.11.1?dts';

import { KoFiData } from "./KoFiData.dto.ts";

const kv = await Deno.openKv();

for await (const entry of kv.list({ prefix: ["lastBelegnummer"] })) {
  await kv.delete(entry.key);
  console.log("Deleted", entry.key);
}

for await (const entry of kv.list({ prefix: ["pdf"] })) {
  await kv.delete(entry.key);
  console.log("Deleted", entry.key);
}

console.log("KV cleared.");



// const kv = await Deno.openKv();

// async function nextBelegnummer(): Promise<string> {
//   const last = (await kv.get<number>(["lastBelegnummer"])).value ?? 0;
//   const next = last + 1;
//   await kv.set(["lastBelegnummer"], next);
//   return `SPENDE-${new Date().getFullYear()}-${String(next).padStart(3, "0")}`;
// }

// async function createPdf(data: KoFiData, belegNummer: string): Promise<Uint8Array> {
//   const pdfDoc = await PDFDocument.create();
//   const page = pdfDoc.addPage([595.28, 841.89]); // DIN A4
//   const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

//   const drawText = (text: string, x: number, y: number) => {
//     page.drawText(text, {
//       x,
//       y,
//       size: 12,
//       font,
//     });
//   };

//   const yStart = 800;
//   drawText("Eigenbeleg", 50, yStart);
//   drawText(`Belegnummer: ${belegNummer}`, 50, yStart - 20);
//   drawText(`Datum: ${new Date(data.timestamp).toLocaleDateString("de-DE")}`, 50, yStart - 40);
//   drawText(`Betrag: ${data.amount} ${data.currency}`, 50, yStart - 60);
//   drawText(`Geber: ${data.from_name || "Anonym"}`, 50, yStart - 80);
//   drawText(`Nachricht: ${data.message || "-"}`, 50, yStart - 100);

//   const pdfBytes = await pdfDoc.save();
//   return pdfBytes;
// }

// async function savePdf(belegNummer: string, pdfBytes: Uint8Array) {
//   await kv.set(["pdf", belegNummer], pdfBytes);
// }

// async function handleBelegDownload(url: URL): Promise<Response> {
//   const id = url.searchParams.get("id");
//   if (!id) return new Response("Missing ID", { status: 400 });

//   const result = await kv.get<Uint8Array>(["pdf", id]);
//   if (!result.value) return new Response("Beleg nicht gefunden", { status: 404 });

//   return new Response(result.value, {
//     headers: {
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `inline; filename=Beleg-${id}.pdf`,
//     },
//   });
// }

// async function handleGetAdminView() {
//   const entries = kv.list<Uint8Array>({ prefix: ["pdf"] });
//   const links: string[] = [];

//   for await (const entry of entries) {
//     const id = entry.key[1].toString(); // ["pdf", "EB-2025-001"]
//     links.push('<li><a href="/beleg?id=' + id + '" target="_blank">' + id + '</a></li>');
//   }

//   const html = `
//         <!DOCTYPE html>
//         <html>
//           <head>
//             <meta charset="utf-8" />
//             <title>Beleg-Übersicht</title>
//           </head>
//           <body>
//             <h1>Alle gespeicherten Belege</h1>
//             <ul>${links.join("")}</ul>
//           </body>
//         </html>
//       `;
//   return new Response(html, {
//     headers: { "Content-Type": "text/html; charset=utf-8" },
//   });
// }

// async function getKoFiData(req: Request) {
//   let bodyText = await req.text();
//   // bodyText is application/x-www-form-urlencoded
//   // decode and parse the data propertys value as json
//   const body = new URLSearchParams(bodyText);
//   const data: KoFiData = JSON.parse(body.get("data") || "{}");
//   return data;
// }

// async function httpRequestHandler(req: Request): Promise<Response> {
//   if (req.method === "POST") {
//     const data: KoFiData = await getKoFiData(req);
//     const belegNummer = await nextBelegnummer();
//     const pdfBytes = await createPdf(data, belegNummer);
//     await savePdf(belegNummer, pdfBytes);
    
//     return new Response(`Beleg ${belegNummer} erstellt und versendet.`, { status: 200 });
//   }

//   if (req.method === "GET") {
//     const url = new URL(req.url);

//     if (url.pathname === "/admin") {
//       return await handleGetAdminView();
//     }

//     if (url.pathname === "/beleg") {
//       return await handleBelegDownload(url);
//     }

//     return new Response("Not Found", { status: 404 });
//   }

//   return new Response("Method not supported", { status: 405 });
// }

// Deno.serve(httpRequestHandler);