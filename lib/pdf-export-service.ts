import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { IncomeEntry, MonthlyStats } from "@/types/income";
import { Company } from "@/types/company";
import { MONTHS } from "./utils";
import { format } from "date-fns";

export interface ExportYearlyLedgerOptions {
    year: number | "all";
    userName?: string;
    userEmail?: string;
    entries: IncomeEntry[];
    monthlyStats?: MonthlyStats[];
    companies?: Company[];
    filterDescription?: string;
}

export function exportYearlyLedgerPDF({
    year,
    userName = "Account Holder",
    userEmail = "",
    entries,
    monthlyStats,
    companies = [],
    filterDescription,
}: ExportYearlyLedgerOptions): void {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    // ---- 1. Financial Calculations ----
    const totalCredits = entries
        .filter((e) => e.type === "credit")
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const primaryCredits = entries
        .filter((e) => e.type === "credit" && e.category === "primary")
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const secondaryCredits = entries
        .filter((e) => e.type === "credit" && e.category === "secondary")
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalDebits = entries
        .filter((e) => e.type === "debit")
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const netBalance = totalCredits - totalDebits;

    const totalReceived = entries
        .filter((e) => e.type === "credit" && e.status === "received")
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalPending = entries
        .filter((e) => e.type === "credit" && e.status === "pending")
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Format currency helper for PDF (using clean standard Rs. formatting)
    const fmt = (amt: number) => `Rs. ${Math.round(amt).toLocaleString("en-IN")}`;

    // ---- 2. Executive Header Banner ----
    // Dark slate banner background
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.roundedRect(margin, margin, contentWidth, 28, 3, 3, "F");

    // Decorative gradient-like accent stripe at top of header
    doc.setFillColor(99, 102, 241); // Indigo
    doc.rect(margin + 3, margin, contentWidth - 6, 1.5, "F");

    // Logo & Brand Name
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("MONEY VIEW", margin + 7, margin + 11);

    // Subtitle badge
    doc.setFontSize(8);
    doc.setTextColor(147, 197, 253); // Light blue
    doc.setFont("helvetica", "normal");
    doc.text(
        "ANNUAL FINANCIAL STATEMENT & YEARLY AUDIT LEDGER",
        margin + 7,
        margin + 17
    );

    // Account Holder & Email
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.text(
        `Account: ${userName} ${userEmail ? `(${userEmail})` : ""}`,
        margin + 7,
        margin + 23
    );

    // Right-side info box in banner
    const yearLabel = year === "all" ? "ALL YEARS" : `YEAR: ${year}`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(yearLabel, pageWidth - margin - 7, margin + 10, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
        `Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`,
        pageWidth - margin - 7,
        margin + 16,
        { align: "right" }
    );
    doc.text(
        `Records: ${entries.length} Transactions | Net: ${fmt(netBalance)}`,
        pageWidth - margin - 7,
        margin + 22,
        { align: "right" }
    );

    let currentY = margin + 33;

    // Optional Filter Applied Notice
    if (filterDescription) {
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "italic");
        doc.text(`Scope: ${filterDescription}`, margin, currentY);
        currentY += 5;
    }

    // ---- 3. Executive KPI Summary Cards Table ----
    autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [
            [
                "TOTAL INFLOW (CREDITS)",
                "PRIMARY STREAM",
                "SECONDARY STREAM",
                "NET FINANCIAL POSITION",
            ],
            [
                "RECEIVED (SETTLED)",
                "PENDING (DUE)",
                "OUTFLOW (DEBITS)",
                "TOTAL RECORDS",
            ],
        ],
        body: [
            [
                fmt(totalCredits),
                fmt(primaryCredits),
                fmt(secondaryCredits),
                fmt(netBalance),
            ],
            [
                fmt(totalReceived),
                fmt(totalPending),
                fmt(totalDebits),
                `${entries.length} Entries`,
            ],
        ],
        theme: "plain",
        styles: {
            fontSize: 9,
            cellPadding: 4,
            halign: "center",
        },
        headStyles: {
            fillColor: [241, 245, 249], // Slate 100
            textColor: [71, 85, 105], // Slate 600
            fontStyle: "bold",
            fontSize: 7.5,
            lineWidth: 0.1,
            lineColor: [226, 232, 240],
        },
        alternateRowStyles: {
            fillColor: [255, 255, 255],
        },
        didParseCell: (data) => {
            // Style the values row with bold numbers and custom colors
            if (data.section === "body") {
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.fontSize = 11;
                data.cell.styles.lineWidth = 0.1;
                data.cell.styles.lineColor = [226, 232, 240];

                if (data.row.index === 0) {
                    if (data.column.index === 0) data.cell.styles.textColor = [16, 185, 129]; // Emerald
                    if (data.column.index === 1) data.cell.styles.textColor = [79, 70, 229]; // Indigo
                    if (data.column.index === 2) data.cell.styles.textColor = [8, 145, 178]; // Cyan
                    if (data.column.index === 3) data.cell.styles.textColor = [124, 58, 237]; // Violet
                } else if (data.row.index === 1) {
                    if (data.column.index === 0) data.cell.styles.textColor = [5, 150, 105]; // Green
                    if (data.column.index === 1) data.cell.styles.textColor = [217, 119, 6]; // Amber
                    if (data.column.index === 2) data.cell.styles.textColor = [225, 29, 72]; // Rose
                    if (data.column.index === 3) data.cell.styles.textColor = [51, 65, 85]; // Slate
                }
            }
        },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // ---- 4. Monthly Summary Table (For Year wise breakdown) ----
    if (year !== "all") {
        // Calculate month-wise breakdown from entries
        const monthBreakdown = MONTHS.map((m) => {
            const monthEntries = entries.filter((e) => e.month === m);
            const mPrimary = monthEntries
                .filter((e) => e.type === "credit" && e.category === "primary")
                .reduce((s, e) => s + Number(e.amount || 0), 0);
            const mSecondary = monthEntries
                .filter((e) => e.type === "credit" && e.category === "secondary")
                .reduce((s, e) => s + Number(e.amount || 0), 0);
            const mDebits = monthEntries
                .filter((e) => e.type === "debit")
                .reduce((s, e) => s + Number(e.amount || 0), 0);
            const mTotal = mPrimary + mSecondary;
            const mReceived = monthEntries
                .filter((e) => e.type === "credit" && e.status === "received")
                .reduce((s, e) => s + Number(e.amount || 0), 0);
            const mPending = monthEntries
                .filter((e) => e.type === "credit" && e.status === "pending")
                .reduce((s, e) => s + Number(e.amount || 0), 0);
            const mNet = mTotal - mDebits;

            return {
                month: m,
                primary: mPrimary,
                secondary: mSecondary,
                total: mTotal,
                received: mReceived,
                pending: mPending,
                debits: mDebits,
                net: mNet,
                count: monthEntries.length,
            };
        });

        // Filter only months with activity unless user wants all
        const activeMonths = monthBreakdown.filter((m) => m.count > 0);
        const displayMonths = activeMonths.length > 0 ? activeMonths : monthBreakdown.slice(0, 12);

        // Section Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`ANNUAL PERFORMANCE BREAKDOWN • ${year}`, margin, currentY);

        autoTable(doc, {
            startY: currentY + 3,
            margin: { left: margin, right: margin },
            head: [
                [
                    "MONTH",
                    "ENTRIES",
                    "PRIMARY",
                    "SECONDARY",
                    "TOTAL INFLOW",
                    "SETTLED (REC)",
                    "PENDING",
                    "NET BALANCE",
                ],
            ],
            body: [
                ...displayMonths.map((m) => [
                    m.month,
                    m.count > 0 ? `${m.count} tx` : "-",
                    m.primary > 0 ? fmt(m.primary) : "-",
                    m.secondary > 0 ? fmt(m.secondary) : "-",
                    m.total > 0 ? fmt(m.total) : "-",
                    m.received > 0 ? fmt(m.received) : "-",
                    m.pending > 0 ? fmt(m.pending) : "-",
                    fmt(m.net),
                ]),
                // Total row
                [
                    "ANNUAL TOTAL",
                    `${entries.length} tx`,
                    fmt(primaryCredits),
                    fmt(secondaryCredits),
                    fmt(totalCredits),
                    fmt(totalReceived),
                    fmt(totalPending),
                    fmt(netBalance),
                ],
            ],
            theme: "grid",
            headStyles: {
                fillColor: [30, 41, 59], // Slate 800
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 7.5,
                halign: "center",
            },
            styles: {
                fontSize: 7.5,
                cellPadding: 2.5,
                halign: "center",
            },
            columnStyles: {
                0: { halign: "left", fontStyle: "bold" },
                1: { halign: "center" },
                2: { halign: "right" },
                3: { halign: "right" },
                4: { halign: "right", fontStyle: "bold", textColor: [16, 185, 129] },
                5: { halign: "right", textColor: [5, 150, 105] },
                6: { halign: "right", textColor: [217, 119, 6] },
                7: { halign: "right", fontStyle: "bold" },
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252],
            },
            didParseCell: (data) => {
                // Highlight final total row
                if (data.section === "body" && data.row.index === displayMonths.length) {
                    data.cell.styles.fillColor = [241, 245, 249];
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.fontSize = 8;
                }
            },
        });

        currentY = (doc as any).lastAutoTable.finalY + 9;
    }

    // ---- 5. Complete Detailed Transaction Ledger Table ----
    // If not enough room on page, start on next page
    if (currentY > pageHeight - 65) {
        doc.addPage();
        currentY = margin + 5;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
        `DETAILED TRANSACTION LEDGER (${entries.length} RECORDS)`,
        margin,
        currentY
    );

    // Prepare table rows
    const tableRows = entries.map((entry, idx) => {
        const isCredit = entry.type === "credit";
        const isReceived = entry.status === "received";

        return [
            (idx + 1).toString(),
            `${entry.month} ${entry.year}`,
            entry.companyName || "Personal / Source",
            entry.description || (isCredit ? "Salary / Payment" : "Expense / Debit"),
            entry.category.toUpperCase(),
            isCredit ? "CREDIT (+)" : "DEBIT (-)",
            isReceived ? "RECEIVED" : "PENDING",
            `${isCredit ? "+" : "-"}${fmt(entry.amount)}`,
        ];
    });

    autoTable(doc, {
        startY: currentY + 3,
        margin: { left: margin, right: margin },
        head: [
            [
                "#",
                "DATE / MONTH",
                "COMPANY / SOURCE",
                "DESCRIPTION",
                "CATEGORY",
                "TYPE",
                "STATUS",
                "AMOUNT (INR)",
            ],
        ],
        body: tableRows,
        theme: "grid",
        headStyles: {
            fillColor: [15, 23, 42], // Deep Slate 900
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 7.5,
            cellPadding: 3,
            halign: "center",
        },
        styles: {
            fontSize: 7.5,
            cellPadding: 2.8,
            textColor: [30, 41, 59],
        },
        columnStyles: {
            0: { halign: "center", cellWidth: 8 },
            1: { halign: "left", cellWidth: 24, fontStyle: "bold" },
            2: { halign: "left", cellWidth: 32 },
            3: { halign: "left", cellWidth: 38 },
            4: { halign: "center", cellWidth: 20 },
            5: { halign: "center", cellWidth: 18 },
            6: { halign: "center", cellWidth: 18 },
            7: { halign: "right", cellWidth: 24, fontStyle: "bold" },
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
        didParseCell: (data) => {
            if (data.section === "body") {
                const row = entries[data.row.index];
                if (!row) return;

                // Color Type Column (col 5)
                if (data.column.index === 5) {
                    if (row.type === "credit") {
                        data.cell.styles.textColor = [5, 150, 105]; // Green
                        data.cell.styles.fontStyle = "bold";
                    } else {
                        data.cell.styles.textColor = [225, 29, 72]; // Red
                        data.cell.styles.fontStyle = "bold";
                    }
                }

                // Color Status Column (col 6)
                if (data.column.index === 6) {
                    if (row.status === "received") {
                        data.cell.styles.textColor = [5, 150, 105];
                        data.cell.styles.fontStyle = "bold";
                    } else {
                        data.cell.styles.textColor = [217, 119, 6]; // Amber
                        data.cell.styles.fontStyle = "bold";
                    }
                }

                // Color Amount Column (col 7)
                if (data.column.index === 7) {
                    if (row.type === "credit") {
                        data.cell.styles.textColor = [5, 150, 105];
                    } else {
                        data.cell.styles.textColor = [225, 29, 72];
                    }
                }
            }
        },
    });

    // ---- 6. Running Header and Footer on All Pages ----
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Header on pages > 1
        if (i > 1) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(148, 163, 184);
            doc.text(
                `Money View • Financial Statement & Ledger (${yearLabel})`,
                margin,
                8
            );
            doc.text(
                `Account: ${userName}`,
                pageWidth - margin,
                8,
                { align: "right" }
            );
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.2);
            doc.line(margin, 10, pageWidth - margin, 10);
        }

        // Footer on all pages
        const footerY = pageHeight - 8;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
            "Money View Financial Analytics • Certified System Generated Statement • Strictly Confidential",
            margin,
            footerY
        );

        doc.setFont("helvetica", "bold");
        doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth - margin,
            footerY,
            { align: "right" }
        );
    }

    // ---- 7. Save and Trigger Download ----
    const fileName = `MoneyView_Ledger_${year}_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
    doc.save(fileName);
}
