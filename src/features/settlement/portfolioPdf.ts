import { jsPDF } from "jspdf";

import type { InvestorSettlement, ProjectSettlement } from "./types";

/** Kop & identitas surat — ubah di sini bila data perusahaan berubah. */
const LETTER = {
  company: "PT KOACI SINERGI INDONESIA",
  addressLines: [
    "Jalan Terusan Sukadamai II No. 5, Kel. Sukabungah,",
    "Kec. Sukajadi, Kota Bandung, Jawa Barat - 40162",
  ],
  contactLines: [
    "Whatsapp: 0831-5938-1201   Homepage: www.koaci.id",
    "Email: marketing@koaci.id",
  ],
  city: "Bandung",
  /** Logo PNG/JPG opsional di folder public. Bila tidak ada, dipakai teks "koaci". */
  logoPath: "/logo.png",
} as const;

export interface PortfolioSigner {
  name: string;
  title: string;
}

interface PortfolioPdfInput {
  settlement: ProjectSettlement;
  investor: InvestorSettlement;
  signer: PortfolioSigner;
}

// --- FORMAT ---

/**
 * Format angka seperti referensi surat: dibulatkan ke rupiah penuh (53.620.000),
 * nol ditampilkan "-". Hanya untuk tampilan surat — nilai di sistem tetap presisi sen.
 */
function money(value: string): string {
  const n = Number(value);
  if (!n) return "-";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
}

function pct(value: string): string {
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(Number(value))}%`;
}

function longDate(iso: string): string {
  const d = iso ? new Date(iso) : new Date();
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(Number.isNaN(d.getTime()) ? new Date() : d);
}

// Penjumlahan desimal dalam satuan sen (BigInt) agar bebas error floating point
function toCents(value: string): bigint {
  const trimmed = value.trim();
  const negative = trimmed.startsWith("-");
  const [intPart = "0", frac = ""] = trimmed.replace("-", "").split(".");
  const cents =
    BigInt(intPart || "0") * BigInt(100) + BigInt(`${frac}00`.slice(0, 2));
  return negative ? -cents : cents;
}

function addDecimals(a: string, b: string): string {
  const total = toCents(a) + toCents(b);
  const negative = total < BigInt(0);
  const abs = negative ? -total : total;
  const hundred = BigInt(100);
  return `${negative ? "-" : ""}${abs / hundred}.${(abs % hundred).toString().padStart(2, "0")}`;
}

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch(LETTER.logoPath);
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/"))
      return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// --- LAYOUT (satuan mm, A4) ---

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BRAND_RGB: [number, number, number] = [30, 64, 175]; // #1E40AF

export function portfolioFileName(
  settlement: ProjectSettlement,
  investor: InvestorSettlement,
): string {
  const safe = (s: string) => s.replace(/[\\/:*?"<>|]+/g, "-").trim();
  return `Portofolio Akhir ${safe(settlement.projectKey)} - ${safe(investor.investorName)}.pdf`;
}

/** Buat & unduh surat "Portofolio Akhir Proyek Investasi" untuk satu investor. */
export async function generatePortfolioPdf(
  input: PortfolioPdfInput,
): Promise<void> {
  const doc = await buildPortfolioPdf(input);
  doc.save(portfolioFileName(input.settlement, input.investor));
}

export async function buildPortfolioPdf({
  settlement,
  investor,
  signer,
}: PortfolioPdfInput): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  // Settlement approved terkunci, jadi updatedAt = waktu approval
  const letterDate = longDate(settlement.updatedAt);

  // ===== KOP SURAT =====
  const logo = await loadLogo();
  if (logo) {
    const props = doc.getImageProperties(logo);
    const h = 14;
    doc.addImage(logo, MARGIN, 14, (props.width / props.height) * h, h);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(...BRAND_RGB);
    doc.text("koaci", MARGIN, 27);
  }

  const headerCenterX = 125;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(LETTER.company, headerCenterX, 16, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  [...LETTER.addressLines, ...LETTER.contactLines].forEach((line, i) => {
    doc.text(line, headerCenterX, 21 + i * 4, { align: "center" });
  });
  doc.setLineWidth(0.6);
  doc.line(MARGIN, 39, PAGE_W - MARGIN, 39);

  // ===== PEMBUKA =====
  let y = 48;
  doc.setFontSize(10.5);
  doc.text("Perihal  :", MARGIN, y);
  doc.text("Portofolio Akhir Proyek Investasi", MARGIN + 18, y);

  y += 12;
  doc.text("Assalamualaikum Wr. Wb.,", MARGIN, y);
  y += 8;
  y = paragraph(
    doc,
    "Sehubungan dengan telah berakhirnya masa pelaksanaan proyek investasi yang Bapak/Ibu investor ikuti, bersama surat ini kami menyampaikan rincian perhitungan pengembalian modal serta bagi hasil investasi.",
    y,
  );
  y += 4;
  y = paragraph(
    doc,
    "Kami informasikan bahwa proses transaksi pengembalian modal dan bagi hasil akan dilaksanakan maksimal dalam waktu 1 x 24 jam, atau setelah tidak terdapat pertanyaan maupun tanggapan dari pihak investor terkait rincian perhitungan yang disampaikan.",
    y,
  );

  // ===== TABEL RINGKASAN =====
  y += 6;
  const tableTop = y;
  const ROW_H = 7.5;
  const labelX = MARGIN + 2;
  const rpX = MARGIN + 105;
  const valueX = PAGE_W - MARGIN - 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("Ringkasan Portofolio Akhir Investor", PAGE_W / 2, y + 7.5, {
    align: "center",
  });
  y += 11;
  hLine(doc, y, 0.4);

  // Identitas investor & proyek
  doc.setFontSize(10);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Nama:", labelX, y);
  doc.setFont("helvetica", "bold");
  doc.text(fit(doc, investor.investorName, 78), MARGIN + 17, y);
  doc.setFont("helvetica", "normal");
  doc.text("Tanggal:", MARGIN + 98, y);
  doc.text(letterDate, MARGIN + 115, y);
  y += 6.5;
  doc.text("Project:", labelX, y);
  doc.setFont("helvetica", "bold");
  doc.text(
    fit(doc, `${settlement.projectKey} - ${settlement.companyName}`, 148),
    MARGIN + 17,
    y,
  );
  y += 3;
  hLine(doc, y, 0.4);

  const rows: { label: string; value?: string; rp?: boolean; bold?: boolean }[] =
    [
      { label: "Transaksi Pembelian", value: money(investor.principalAmount), rp: true, bold: true },
      { label: "% Porsi Modal", value: pct(investor.modalPortionPct) },
      { label: "Estimasi Modal", value: money(settlement.totalCapital), rp: true },
      { label: "Nilai Jual", value: money(settlement.salesAmount), rp: true },
      { label: "Estimasi Margin PO", value: money(settlement.grossMargin), rp: true },
      // Biaya lain hanya ditampilkan bila ada, agar alur hitung tetap transparan
      ...(Number(settlement.otherCost) !== 0
        ? [
            {
              label: settlement.otherCostDescription
                ? `Biaya Lain (${settlement.otherCostDescription})`
                : "Biaya Lain",
              value: money(settlement.otherCost),
              rp: true,
            },
          ]
        : []),
      { label: "Keuntungan Bersih", value: money(settlement.netProfitMargin), rp: true },
      {
        label: `${pct(settlement.applicantSharePct)} ${settlement.companyName}`,
        value: money(settlement.applicantShareAmount),
        rp: true,
      },
      { label: `${pct(settlement.koaciSharePct)} Koaci`, value: money(settlement.koaciShareAmount), rp: true },
      { label: "Bagi Hasil Bersih", value: money(settlement.koaciShareAmount), rp: true },
      {
        label: `Kompensasi ${pct(investor.compensationPct)}`,
        value: money(investor.compensationAmount),
        rp: true,
      },
      { label: `${pct(settlement.koaciPortionPct)} Koaci`, value: money(settlement.koaciPortionAmount), rp: true },
      {
        label: `${pct(settlement.investorPortionPct)} Investor`,
        value: money(settlement.investorPortionAmount),
        rp: true,
      },
      {
        label: "Imbal Bagi Hasil Sesuai Porsi Modal",
        value: money(investor.profitShareAmount),
        rp: true,
      },
    ];

  for (const row of rows) {
    const baseline = y + ROW_H - 2.4;
    doc.setFont("helvetica", row.bold ? "bold" : "normal");
    doc.text(fit(doc, row.label, 98), labelX, baseline);
    if (row.rp) doc.text("Rp", rpX, baseline);
    if (row.value) doc.text(row.value, valueX, baseline, { align: "right" });
    y += ROW_H;
    hLine(doc, y, 0.15);
  }

  // Portofolio akhir = modal disetor + total bagi hasil (bagi hasil + kompensasi)
  hLine(doc, y, 0.5);
  const finalValue = addDecimals(investor.principalAmount, investor.totalProfit);
  const finalBaseline = y + ROW_H - 2.4;
  doc.setFont("helvetica", "bold");
  doc.text("Portofolio Akhir", labelX, finalBaseline);
  doc.text("Rp", rpX, finalBaseline);
  doc.text(money(finalValue), valueX, finalBaseline, { align: "right" });
  y += ROW_H;

  doc.setLineWidth(0.5);
  doc.rect(MARGIN, tableTop, CONTENT_W, y - tableTop);

  // ===== PENUTUP (halaman baru bila tidak cukup ruang) =====
  const CLOSING_H = 110;
  if (y + 10 + CLOSING_H > PAGE_H - MARGIN) {
    doc.addPage();
    y = MARGIN + 5;
  } else {
    y += 12;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  y = paragraph(
    doc,
    "Demikian informasi dan rincian perhitungan ini kami sampaikan sebagai bentuk transparansi dan pertanggungjawaban atas proyek investasi yang telah berjalan.",
    y,
  );
  y += 4;
  y = paragraph(
    doc,
    'Dengan telah disampaikannya dan dilaksanakannya pengembalian modal dan bagi hasil proyek ini, maka secara bersama-sama dan sah proyek yang Bapak/Ibu investor ikuti dinyatakan "SELESAI".',
    y,
  );
  y += 4;
  y = paragraph(
    doc,
    "Atas kepercayaan dan kerja sama yang telah diberikan, kami ucapkan terima kasih. Semoga kerja sama yang baik ini dapat terus terjalin pada proyek-proyek berikutnya.",
    y,
  );

  // Blok tanda tangan (rata tengah di sisi kanan)
  const signX = 152;
  y += 14;
  doc.text(`${LETTER.city}, ${letterDate}`, signX, y, { align: "center" });
  y += 5;
  doc.text("Hormat kami,", signX, y, { align: "center" });
  y += 30; // ruang tanda tangan basah / stempel
  doc.setFont("helvetica", "bold");
  doc.text(signer.name, signX, y, { align: "center" });
  const nameW = doc.getTextWidth(signer.name);
  doc.setLineWidth(0.3);
  doc.line(signX - nameW / 2, y + 0.8, signX + nameW / 2, y + 0.8);
  if (signer.title) {
    y += 5;
    doc.setFont("helvetica", "italic");
    doc.text(signer.title, signX, y, { align: "center" });
  }

  y += 14;
  doc.setTextColor(110, 110, 110);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.text("Powered by", MARGIN, y);
  doc.setFont("helvetica", "bold");
  doc.text(LETTER.company, MARGIN, y + 3.5);

  return doc;
}

function paragraph(doc: jsPDF, text: string, y: number): number {
  const LINE_H = 5;
  const lines: string[] = doc.splitTextToSize(text, CONTENT_W);
  lines.forEach((line, i) => doc.text(line, MARGIN, y + i * LINE_H));
  return y + lines.length * LINE_H;
}

function hLine(doc: jsPDF, y: number, width: number) {
  doc.setLineWidth(width);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
}

/** Potong teks agar muat dalam lebar tertentu (mm), dengan elipsis. */
function fit(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && doc.getTextWidth(`${out}...`) > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out.trimEnd()}...`;
}
