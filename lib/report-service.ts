import { DailyReport, MonthlyReport, Transaction, BusinessProfile } from '@/types/customer'
import { getAllTransactions, getTransactionsByDateRange } from './ledger-service'
import { getBusinessProfile } from './business-service'
import { getCustomerStats } from './customer-service'
import { MONTHS } from './utils'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function generateDailyReport(
  userId: string,
  date: Date
): Promise<DailyReport> {
  try {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const transactions = await getTransactionsByDateRange(userId, startOfDay, endOfDay)

    const totalCredits = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalDebits = transactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      date,
      totalCredits,
      totalDebits,
      netAmount: totalCredits - totalDebits,
      transactionCount: transactions.length,
      transactions,
    }
  } catch (error) {
    console.error('Error generating daily report:', error)
    throw error
  }
}

export async function generateMonthlyReport(
  userId: string,
  month: number,
  year: number
): Promise<MonthlyReport> {
  try {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)

    const transactions = await getTransactionsByDateRange(userId, startDate, endDate)

    const totalCredits = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalDebits = transactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)

    // Daily breakdown
    const dailyMap: Record<string, { credits: number; debits: number }> = {}
    transactions.forEach((t) => {
      const dateKey = format(t.date, 'yyyy-MM-dd')
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { credits: 0, debits: 0 }
      }
      if (t.type === 'credit') {
        dailyMap[dateKey].credits += t.amount
      } else {
        dailyMap[dateKey].debits += t.amount
      }
    })

    const dailyBreakdown = Object.entries(dailyMap).map(([date, data]) => ({
      date,
      credits: data.credits,
      debits: data.debits,
      net: data.credits - data.debits,
    })).sort((a, b) => a.date.localeCompare(b.date))

    // Customer breakdown
    const customerMap: Record<string, { name: string; credits: number; debits: number; balance: number }> = {}
    transactions.forEach((t) => {
      if (!customerMap[t.customerId]) {
        customerMap[t.customerId] = {
          name: t.customerName,
          credits: 0,
          debits: 0,
          balance: 0,
        }
      }
      if (t.type === 'credit') {
        customerMap[t.customerId].credits += t.amount
        customerMap[t.customerId].balance += t.amount
      } else {
        customerMap[t.customerId].debits += t.amount
        customerMap[t.customerId].balance -= t.amount
      }
    })

    const customerBreakdown = Object.entries(customerMap).map(([customerId, data]) => ({
      customerId,
      customerName: data.name,
      credits: data.credits,
      debits: data.debits,
      balance: data.balance,
    }))

    return {
      month: MONTHS[month],
      year,
      totalCredits,
      totalDebits,
      netAmount: totalCredits - totalDebits,
      transactionCount: transactions.length,
      dailyBreakdown,
      customerBreakdown,
    }
  } catch (error) {
    console.error('Error generating monthly report:', error)
    throw error
  }
}

export async function generateRangeReport(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<MonthlyReport> {
  try {
    const transactions = await getTransactionsByDateRange(userId, startDate, endDate)

    const totalCredits = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalDebits = transactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)

    // Daily breakdown
    const dailyMap: Record<string, { credits: number; debits: number }> = {}
    transactions.forEach((t) => {
      const dateKey = format(t.date, 'yyyy-MM-dd')
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { credits: 0, debits: 0 }
      }
      if (t.type === 'credit') {
        dailyMap[dateKey].credits += t.amount
      } else {
        dailyMap[dateKey].debits += t.amount
      }
    })

    const dailyBreakdown = Object.entries(dailyMap).map(([date, data]) => ({
      date,
      credits: data.credits,
      debits: data.debits,
      net: data.credits - data.debits,
    })).sort((a, b) => a.date.localeCompare(b.date))

    // Customer breakdown
    const customerMap: Record<string, { name: string; credits: number; debits: number; balance: number }> = {}
    transactions.forEach((t) => {
      if (!customerMap[t.customerId]) {
        customerMap[t.customerId] = {
          name: t.customerName,
          credits: 0,
          debits: 0,
          balance: 0,
        }
      }
      if (t.type === 'credit') {
        customerMap[t.customerId].credits += t.amount
        customerMap[t.customerId].balance += t.amount
      } else {
        customerMap[t.customerId].debits += t.amount
        customerMap[t.customerId].balance -= t.amount
      }
    })

    const customerBreakdown = Object.entries(customerMap).map(([customerId, data]) => ({
      customerId,
      customerName: data.name,
      credits: data.credits,
      debits: data.debits,
      balance: data.balance,
    }))

    return {
      month: `${format(startDate, 'MMM')} - ${format(endDate, 'MMM')}`,
      year: startDate.getFullYear(),
      totalCredits,
      totalDebits,
      netAmount: totalCredits - totalDebits,
      transactionCount: transactions.length,
      dailyBreakdown,
      customerBreakdown,
    }
  } catch (error) {
    console.error('Error generating range report:', error)
    throw error
  }
}

export async function getPendingSummary(userId: string) {
  try {
    const stats = await getCustomerStats(userId);
    return {
      totalPending: stats.totalReceivables,
      totalPayables: stats.totalPayables,
    }
  } catch (error) {
    console.error('Error getting pending summary:', error);
    return { totalPending: 0, totalPayables: 0 };
  }
}

export async function exportToCSV(data: any[], filename: string): Promise<void> {
  if (data.length === 0) return

  const headers = Object.keys(data[0]).join(',')
  const rows = data.map((row) => Object.values(row).join(','))
  const csv = [headers, ...rows].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export async function exportToPDF(
    title: string, 
    summaryData: { label: string; value: string }[], 
    tableData: any[], 
    columns: { header: string; dataKey: string }[],
    userId: string
): Promise<void> {
    const doc = new jsPDF();
    const profile = await getBusinessProfile(userId);
    const businessName = profile?.businessName || "MoneyView";
    const address = profile?.address || "";
    const phone = profile?.phone || "";

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 44, 52);
    doc.text(businessName, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    if (address) doc.text(address, 14, 27);
    if (phone) doc.text(`Phone: ${phone}`, 14, 32);

    doc.setDrawColor(200);
    doc.line(14, 38, 196, 38);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(title, 14, 50);

    // Summary Table
    autoTable(doc, {
        startY: 55,
        head: [['Summary', 'Amount']],
        body: summaryData.map(item => [item.label, item.value]),
        theme: 'striped',
        headStyles: { fillColor: [100, 100, 255] },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 }
    });

    // Details Table
    doc.setFontSize(14);
    doc.text("Detailed Transactions", 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [columns.map(col => col.header)],
        body: tableData.map(row => columns.map(col => row[col.dataKey])),
        theme: 'grid',
        headStyles: { fillColor: [40, 44, 52] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Generated by MoneyView on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
            14,
            doc.internal.pageSize.height - 10
        );
    }

    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
}

