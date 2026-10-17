import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { IncomeEntry, MonthlyStats } from "@/types/income";
import { Company } from "@/types/company";
import { MONTHS } from "./utils";
import { format } from "date-fns";

export type ReportTypeScope =
    | "complete"
    | "income_only"
    | "received_only"
    | "pending_dues"
    | "expenses_only"
    | "company_statement"
    | "custom_view";

export interface ExportAdvancedPDFOptions {
    reportType?: ReportTypeScope;
    reportTitle?: string;
    reportSubtitle?: string;
    year: number | "all";
    month?: string | "all";
    selectedCompanyId?: string | "all";
    selectedCompanyName?: string;
    userName?: string;
    userEmail?: string;
    entries: IncomeEntry[];
    allCompanies?: Company[];
    monthlyStats?: MonthlyStats[];
    filterDescription?: string;
    includeKPISummary?: boolean;
    includeMonthlyBreakdown?: boolean;
    includeCompanyBreakdown?: boolean;
    includeTransactionLedger?: boolean;
}

// Backward compatible interface
export type ExportYearlyLedgerOptions = ExportAdvancedPDFOptions;

export function exportYearlyLedgerPDF(options: ExportAdvancedPDFOptions): void {
    const {
        reportType = "complete",
        reportTitle,
        reportSubtitle,
        year,
        month = "all",
        selectedCompanyName,
        userName = "Account Holder",
        userEmail = "",
        entries,
        allCompanies = [],
        filterDescription,
        includeKPISummary = true,
        includeMonthlyBreakdown = true,
        includeCompanyBreakdown = false,
        includeTransactionLedger = true,
    } = options;

    if (!entries || entries.length === 0) {
        throw new Error("No transactions available to generate PDF.");
    }

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    // Helper for formatting currency safely (Helvetica does not support Unicode ₹ symbol)
    const fmt = (amt: number) => `Rs. ${Math.round(amt || 0).toLocaleString("en-IN")}`;

    // ---- 1. Calculations on Filtered Scope ----
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

    // Dynamic Title & Badge based on report type
    let mainHeading = "MONEY VIEW FINANCIAL STATEMENT";
    let subHeading = "ANNUAL FINANCIAL STATEMENT & YEARLY AUDIT LEDGER";
    let accentColorRGB = [99, 102, 241]; // Indigo default

    if (reportType === "pending_dues") {
        mainHeading = "OUTSTANDING DUES & PENDING RECEIVABLES";
        subHeading = "DETAILED AUDIT LEDGER OF UNPAID / DUE COLLECTIONS";
        accentColorRGB = [217, 119, 6]; // Amber
    } else if (reportType === "received_only") {
        mainHeading = "SETTLED CASH INFLOW & REALIZED REVENUE";
        subHeading = "OFFICIAL STATEMENT OF RECEIVED COLLECTIONS & INCOME";
        accentColorRGB = [16, 185, 129]; // Emerald
    } else if (reportType === "income_only") {
        mainHeading = "CASH INFLOW & EARNINGS STATEMENT";
        subHeading = "PRIMARY & SECONDARY REVENUE STREAMS BREAKDOWN";
        accentColorRGB = [16, 185, 129]; // Emerald
    } else if (reportType === "expenses_only") {
        mainHeading = "EXPENDITURE & CASH OUTFLOW STATEMENT";
        subHeading = "DETAILED AUDIT OF DEBITS, PAYMENTS & EXPENSES";
        accentColorRGB = [225, 29, 72]; // Rose
    } else if (reportType === "company_statement") {
        mainHeading = `CLIENT STATEMENT: ${selectedCompanyName || "COMPANY ACCOUNT"}`.toUpperCase();
        subHeading = "DEDICATED RECONCILIATION & TRANSACTION AUDIT";
        accentColorRGB = [59, 130, 246]; // Blue
    } else if (reportType === "custom_view") {
        mainHeading = "CUSTOM FILTERED TRANSACTION REPORT";
        subHeading = "TAILORED FINANCIAL LEDGER EXPORT";
        accentColorRGB = [139, 92, 246]; // Purple
    }

    if (reportTitle) mainHeading = reportTitle;
    if (reportSubtitle) subHeading = reportSubtitle;

    // ---- 2. Executive Header Banner ----
    // Slate background
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.roundedRect(margin, margin, contentWidth, 30, 3, 3, "F");

    // Dynamic accent color stripe at top
    doc.setFillColor(accentColorRGB[0], accentColorRGB[1], accentColorRGB[2]);
    doc.rect(margin + 3, margin, contentWidth - 6, 1.8, "F");

    // Main Heading & Logo
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(mainHeading, margin + 7, margin + 11);

    // Subtitle badge
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.setFont("helvetica", "normal");
    doc.text(subHeading, margin + 7, margin + 17);

    // User Details
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
        `Account: ${userName} ${userEmail ? `(${userEmail})` : ""}`,
        margin + 7,
        margin + 24
    );

    // Right-side Info Box
    const yearLabel =
        year === "all"
            ? "ALL YEARS"
            : month && month !== "all"
            ? `${month.toUpperCase()} ${year}`
            : `YEAR: ${year}`;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(yearLabel, pageWidth - margin - 7, margin + 10, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
        `Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`,
        pageWidth - margin - 7,
        margin + 16,
        { align: "right" }
    );
    doc.text(
        `Scope: ${entries.length} Records | Net Total: ${fmt(
            reportType === "expenses_only" ? totalDebits : reportType === "pending_dues" ? totalPending : netBalance
        )}`,
        pageWidth - margin - 7,
        margin + 22,
        { align: "right" }
    );

    let currentY = margin + 35;

    // Optional Filter Description Notice
    if (filterDescription) {
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "italic");
        doc.text(`Active Scope / Parameters: ${filterDescription}`, margin, currentY);
        currentY += 5;
    }

    // ---- 3. Executive KPI Summary Cards Table ----
    if (includeKPISummary) {
        let kpiHead1 = [
            "TOTAL INFLOW (CREDITS)",
            "PRIMARY STREAM",
            "SECONDARY STREAM",
            "NET FINANCIAL POSITION",
        ];
        let kpiHead2 = [
            "RECEIVED (SETTLED)",
            "PENDING (DUE)",
            "OUTFLOW (DEBITS)",
            "TOTAL RECORDS IN SCOPE",
        ];

        let kpiRow1 = [
            fmt(totalCredits),
            fmt(primaryCredits),
            fmt(secondaryCredits),
            fmt(netBalance),
        ];
        let kpiRow2 = [
            fmt(totalReceived),
            fmt(totalPending),
            fmt(totalDebits),
            `${entries.length} Entries`,
        ];

        if (reportType === "pending_dues") {
            kpiHead1 = ["TOTAL PENDING DUE", "PRIMARY DUE", "SECONDARY DUE", "OVERDUE INVOICES"];
            kpiHead2 = ["CLEARED IN SCOPE", "LARGEST UNPAID", "COMPANIES WITH DUES", "RECORDS FOUND"];
            
            const largestPending = Math.max(
                ...entries.filter((e) => e.status === "pending").map((e) => Number(e.amount || 0)),
                0
            );
            const companiesWithDues = new Set(
                entries.filter((e) => e.status === "pending").map((e) => e.companyName || "Personal")
            ).size;

            kpiRow1 = [
                fmt(totalPending),
                fmt(entries.filter((e) => e.status === "pending" && e.category === "primary").reduce((s, e) => s + Number(e.amount || 0), 0)),
                fmt(entries.filter((e) => e.status === "pending" && e.category === "secondary").reduce((s, e) => s + Number(e.amount || 0), 0)),
                `${entries.filter((e) => e.status === "pending").length} Items`,
            ];
            kpiRow2 = [
                fmt(totalReceived),
                fmt(largestPending),
                `${companiesWithDues} Parties`,
                `${entries.length} Records`,
            ];
        } else if (reportType === "expenses_only") {
            kpiHead1 = ["TOTAL EXPENDITURE", "MONTHLY AVERAGE", "LARGEST DEBIT", "TRANSACTION COUNT"];
            kpiHead2 = ["PRIMARY CATEGORY", "SECONDARY CATEGORY", "ACTIVE MONTHS", "SCOPE STATUS"];
            
            const largestDebit = Math.max(...entries.map((e) => Number(e.amount || 0)), 0);
            const monthsCovered = new Set(entries.map((e) => e.month)).size || 1;
            const avgDebit = totalDebits / monthsCovered;

            kpiRow1 = [fmt(totalDebits), fmt(avgDebit), fmt(largestDebit), `${entries.length} Debits`];
            kpiRow2 = [
                fmt(entries.filter((e) => e.category === "primary").reduce((s, e) => s + Number(e.amount || 0), 0)),
                fmt(entries.filter((e) => e.category === "secondary").reduce((s, e) => s + Number(e.amount || 0), 0)),
                `${monthsCovered} Months`,
                "Audited Debits",
            ];
        } else if (reportType === "company_statement") {
            kpiHead1 = ["TOTAL BILLED (CREDITS)", "RECEIVED FROM CLIENT", "OUTSTANDING BALANCE", "SETTLEMENT RATE"];
            kpiHead2 = ["TOTAL DEBITS", "NET POSITION", "TOTAL INVOICES", "CLIENT CATEGORY"];

            const settlementRate = totalCredits > 0 ? Math.round((totalReceived / totalCredits) * 100) : 100;
            kpiRow1 = [
                fmt(totalCredits),
                fmt(totalReceived),
                fmt(totalPending),
                `${settlementRate}%`,
            ];
            kpiRow2 = [
                fmt(totalDebits),
                fmt(netBalance),
                `${entries.length} Records`,
                entries[0]?.category?.toUpperCase() || "PRIMARY",
            ];
        }

        autoTable(doc, {
            startY: currentY,
            margin: { left: margin, right: margin },
            head: [kpiHead1, kpiHead2],
            body: [kpiRow1, kpiRow2],
            theme: "plain",
            styles: {
                fontSize: 8.5,
                cellPadding: 3.5,
                halign: "center",
            },
            headStyles: {
                fillColor: [241, 245, 249],
                textColor: [71, 85, 105],
                fontStyle: "bold",
                fontSize: 7,
                lineWidth: 0.1,
                lineColor: [226, 232, 240],
            },
            didParseCell: (data) => {
                if (data.section === "body") {
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.fontSize = 10;
                    data.cell.styles.lineWidth = 0.1;
                    data.cell.styles.lineColor = [226, 232, 240];

                    if (reportType === "pending_dues") {
                        if (data.row.index === 0 && data.column.index === 0) {
                            data.cell.styles.textColor = [217, 119, 6]; // Amber
                        }
                    } else if (reportType === "expenses_only") {
                        if (data.row.index === 0 && data.column.index === 0) {
                            data.cell.styles.textColor = [225, 29, 72]; // Rose
                        }
                    } else {
                        if (data.row.index === 0 && data.column.index === 0) data.cell.styles.textColor = [16, 185, 129];
                        if (data.row.index === 0 && data.column.index === 3) data.cell.styles.textColor = [124, 58, 237];
                        if (data.row.index === 1 && data.column.index === 0) data.cell.styles.textColor = [5, 150, 105];
                        if (data.row.index === 1 && data.column.index === 1) data.cell.styles.textColor = [217, 119, 6];
                    }
                }
            },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // ---- 4. Monthly Performance Breakdown Table ----
    if (includeMonthlyBreakdown && year !== "all" && entries.length > 0) {
        // Build monthly aggregation
        const monthBreakdown = MONTHS.map((m) => {
            const mEntries = entries.filter((e) => e.month === m);
            const mPrimary = mEntries
                .filter((e) => e.type === "credit" && e.category === "primary")
                .reduce((s, e) => s + Number(e.amount || 0), 0);
            const mSecondary = mEntries
                .filter((e) => e.type === "credit" && e.category === "secondary")
                .reduce((s, e) => s + Number(e.amount || 0), 0);
            const mDebits = mEntries
                .filter((e) => e.type === "debit")
                .reduce((s, e) => s + Number(e.amount || 0), 0);
            const mCredits = mPrimary + mSecondary;
            const mReceived = mEntries
                .filter((e) => e.type === "credit" && e.status === "received")
                .reduce((s, e) => s + Number(e.amount || 0), 0);
            const mPending = mEntries
                .filter((e) => e.type === "credit" && e.status === "pending")
                .reduce((s, e) => s + Number(e.amount || 0), 0);
            const mNet = mCredits - mDebits;

            return {
                month: m,
                primary: mPrimary,
                secondary: mSecondary,
                total: mCredits,
                received: mReceived,
                pending: mPending,
                debits: mDebits,
                net: mNet,
                count: mEntries.length,
            };
        });

        const activeMonths = monthBreakdown.filter((m) => m.count > 0);
        const displayMonths = activeMonths.length > 0 ? activeMonths : monthBreakdown.slice(0, 12);

        if (displayMonths.length > 0) {
            // Check space
            if (currentY > pageHeight - 60) {
                doc.addPage();
                currentY = margin + 5;
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.text(`MONTHLY TIMELINE & CASH FLOW BREAKDOWN (${year})`, margin, currentY);

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
                    // Summary row
                    [
                        "TOTAL IN SCOPE",
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
                    fillColor: [30, 41, 59],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 7.5,
                    halign: "center",
                },
                styles: {
                    fontSize: 7.5,
                    cellPadding: 2.2,
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
                    if (data.section === "body" && data.row.index === displayMonths.length) {
                        data.cell.styles.fillColor = [241, 245, 249];
                        data.cell.styles.fontStyle = "bold";
                        data.cell.styles.fontSize = 8;
                    }
                },
            });

            currentY = (doc as any).lastAutoTable.finalY + 8;
        }
    }

    // ---- 5. Company / Source Breakdown Table (Optional & High-Value) ----
    if (includeCompanyBreakdown && entries.length > 0) {
        // Group entries by company name
        const companyMap = new Map<
            string,
            { name: string; credits: number; received: number; pending: number; debits: number; count: number }
        >();

        entries.forEach((entry) => {
            const cName = entry.companyName || "Personal / Direct Source";
            const current = companyMap.get(cName) || {
                name: cName,
                credits: 0,
                received: 0,
                pending: 0,
                debits: 0,
                count: 0,
            };

            current.count += 1;
            const amt = Number(entry.amount || 0);
            if (entry.type === "credit") {
                current.credits += amt;
                if (entry.status === "received") current.received += amt;
                else current.pending += amt;
            } else {
                current.debits += amt;
            }

            companyMap.set(cName, current);
        });

        const companyList = Array.from(companyMap.values()).sort((a, b) => b.credits - a.credits);

        if (companyList.length > 0) {
            if (currentY > pageHeight - 55) {
                doc.addPage();
                currentY = margin + 5;
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(15, 23, 42);
            doc.text("CLIENT & SOURCE RECONCILIATION BREAKDOWN", margin, currentY);

            autoTable(doc, {
                startY: currentY + 3,
                margin: { left: margin, right: margin },
                head: [
                    ["COMPANY / SOURCE", "ENTRIES", "TOTAL INVOICED", "RECEIVED (SETTLED)", "PENDING DUE", "OUTFLOW", "NET POS."],
                ],
                body: companyList.map((c) => [
                    c.name,
                    `${c.count} tx`,
                    fmt(c.credits),
                    fmt(c.received),
                    fmt(c.pending),
                    fmt(c.debits),
                    fmt(c.credits - c.debits),
                ]),
                theme: "grid",
                headStyles: {
                    fillColor: [51, 65, 85], // Slate 700
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 7.5,
                    halign: "center",
                },
                styles: {
                    fontSize: 7.5,
                    cellPadding: 2.2,
                    halign: "center",
                },
                columnStyles: {
                    0: { halign: "left", fontStyle: "bold" },
                    1: { halign: "center" },
                    2: { halign: "right", fontStyle: "bold", textColor: [16, 185, 129] },
                    3: { halign: "right", textColor: [5, 150, 105] },
                    4: { halign: "right", textColor: [217, 119, 6] },
                    5: { halign: "right", textColor: [225, 29, 72] },
                    6: { halign: "right", fontStyle: "bold" },
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252],
                },
            });

            currentY = (doc as any).lastAutoTable.finalY + 8;
        }
    }

    // ---- 6. Detailed Transaction Ledger Table ----
    if (includeTransactionLedger && entries.length > 0) {
        if (currentY > pageHeight - 65) {
            doc.addPage();
            currentY = margin + 5;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(
            `DETAILED TRANSACTION AUDIT RECORDS (${entries.length} TRANSACTIONS)`,
            margin,
            currentY
        );

        const tableRows = entries.map((entry, idx) => {
            const isCredit = entry.type === "credit";
            const isReceived = entry.status === "received";

            return [
                (idx + 1).toString(),
                `${entry.month} ${entry.year}`,
                entry.companyName || "Personal / Source",
                entry.description || (isCredit ? "Salary / Revenue" : "Expense / Debit"),
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
                    "PERIOD",
                    "COMPANY / SOURCE",
                    "DESCRIPTION",
                    "CAT.",
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
                cellPadding: 2.8,
                halign: "center",
            },
            styles: {
                fontSize: 7.5,
                cellPadding: 2.5,
                textColor: [30, 41, 59],
            },
            columnStyles: {
                0: { halign: "center", cellWidth: 8 },
                1: { halign: "left", cellWidth: 22, fontStyle: "bold" },
                2: { halign: "left", cellWidth: 32 },
                3: { halign: "left", cellWidth: 40 },
                4: { halign: "center", cellWidth: 18 },
                5: { halign: "center", cellWidth: 18 },
                6: { halign: "center", cellWidth: 18 },
                7: { halign: "right", cellWidth: 26, fontStyle: "bold" },
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252],
            },
            didParseCell: (data) => {
                if (data.section === "body") {
                    const row = entries[data.row.index];
                    if (!row) return;

                    // Type Column (col 5)
                    if (data.column.index === 5) {
                        data.cell.styles.fontStyle = "bold";
                        data.cell.styles.textColor =
                            row.type === "credit" ? [5, 150, 105] : [225, 29, 72];
                    }

                    // Status Column (col 6)
                    if (data.column.index === 6) {
                        data.cell.styles.fontStyle = "bold";
                        data.cell.styles.textColor =
                            row.status === "received" ? [5, 150, 105] : [217, 119, 6];
                    }

                    // Amount Column (col 7)
                    if (data.column.index === 7) {
                        data.cell.styles.textColor =
                            row.type === "credit" ? [5, 150, 105] : [225, 29, 72];
                    }
                }
            },
        });
    }

    // ---- 7. Running Headers & Footers across all pages ----
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Header for page 2 and beyond
        if (i > 1) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(148, 163, 184);
            doc.text(
                `Money View • ${mainHeading} (${yearLabel})`,
                margin,
                8
            );
            doc.text(`Account: ${userName}`, pageWidth - margin, 8, {
                align: "right",
            });
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

    // ---- 8. Save and Download ----
    const safeTypeTag = reportType.replace(/_/g, "-");
    const fileName = `MoneyView_${safeTypeTag}_${year}_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
    doc.save(fileName);
}
