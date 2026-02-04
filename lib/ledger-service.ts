import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  getDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { Transaction, LedgerEntry } from '@/types/customer'
import { updateCustomerBalance, getCustomer } from './customer-service'

const COLLECTION_NAME = 'transactions'

export async function addTransaction(
  transaction: Omit<Transaction, 'id' | 'createdAt' | 'userId' | 'balanceAfter'>,
  userId: string
): Promise<string> {
  try {
    // Get current customer to calculate new balance
    const customer = await getCustomer(transaction.customerId, userId)
    if (!customer) {
      throw new Error('Customer not found')
    }

    // Calculate new balance
    const balanceChange = transaction.type === 'credit' 
      ? transaction.amount 
      : -transaction.amount
    const newBalance = customer.currentBalance + balanceChange

    const dataToWrite = {
      ...transaction,
      userId,
      balanceAfter: newBalance,
      date: Timestamp.fromDate(transaction.date),
      createdAt: Timestamp.now(),
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToWrite)
    console.log('Transaction added successfully with ID:', docRef.id)

    // Update customer balance
    await updateCustomerBalance(transaction.customerId, userId, newBalance)

    return docRef.id
  } catch (error) {
    console.error('Error adding transaction:', error)
    throw error
  }
}

export async function deleteTransaction(
  id: string,
  userId: string
): Promise<void> {
  try {
    // Get transaction to recalculate balance
    const transactionDoc = await getDoc(doc(db, COLLECTION_NAME, id))
    if (!transactionDoc.exists()) {
      throw new Error('Transaction not found')
    }

    const transaction = transactionDoc.data() as Transaction
    const customer = await getCustomer(transaction.customerId, userId)
    if (!customer) {
      throw new Error('Customer not found')
    }

    // Reverse the balance change
    const balanceChange = transaction.type === 'credit' 
      ? -transaction.amount 
      : transaction.amount
    const newBalance = customer.currentBalance + balanceChange

    await deleteDoc(doc(db, COLLECTION_NAME, id))

    // Update customer balance
    await updateCustomerBalance(transaction.customerId, userId, newBalance)
  } catch (error) {
    console.error('Error deleting transaction:', error)
    throw error
  }
}

export async function getTransactionsByCustomer(
  customerId: string,
  userId: string
): Promise<Transaction[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('customerId', '==', customerId),
      orderBy('date', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate ? doc.data().date.toDate() : (doc.data().date instanceof Date ? doc.data().date : new Date()),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : (doc.data().createdAt instanceof Date ? doc.data().createdAt : new Date()),
    })) as Transaction[]
  } catch (error) {
    console.error('Error fetching transactions:', error)
    throw error
  }
}

export async function getAllTransactions(userId: string): Promise<Transaction[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate ? doc.data().date.toDate() : (doc.data().date instanceof Date ? doc.data().date : new Date()),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : (doc.data().createdAt instanceof Date ? doc.data().createdAt : new Date()),
    })) as Transaction[]
  } catch (error) {
    console.error('Error fetching all transactions:', error)
    throw error
  }
}

export async function getTransactionsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Transaction[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate ? doc.data().date.toDate() : (doc.data().date instanceof Date ? doc.data().date : new Date()),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : (doc.data().createdAt instanceof Date ? doc.data().createdAt : new Date()),
    })) as Transaction[]
  } catch (error) {
    console.error('Error fetching transactions by date range:', error)
    throw error
  }
}

export async function getLedgerEntries(
  customerId: string,
  userId: string
): Promise<LedgerEntry[]> {
  try {
    const transactions = await getTransactionsByCustomer(customerId, userId)
    const customer = await getCustomer(customerId, userId)
    
    if (!customer) {
      return []
    }

    // Sort by date ascending to calculate running balance
    const sortedTransactions = [...transactions].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    )

    let runningBalance = customer.openingBalance
    const ledgerEntries: LedgerEntry[] = []

    // Add opening balance entry
    if (customer.openingBalance !== 0) {
      ledgerEntries.push({
        date: customer.createdAt,
        description: 'Opening Balance',
        credit: customer.openingBalance > 0 ? customer.openingBalance : 0,
        debit: customer.openingBalance < 0 ? Math.abs(customer.openingBalance) : 0,
        balance: customer.openingBalance,
        transactionId: 'opening',
      })
    }

    // Add transaction entries
    sortedTransactions.forEach((transaction) => {
      const credit = transaction.type === 'credit' ? transaction.amount : 0
      const debit = transaction.type === 'debit' ? transaction.amount : 0
      runningBalance += credit - debit

      ledgerEntries.push({
        date: transaction.date,
        description: transaction.description || `${transaction.type} transaction`,
        credit,
        debit,
        balance: runningBalance,
        transactionId: transaction.id,
      })
    })

    return ledgerEntries
  } catch (error) {
    console.error('Error generating ledger entries:', error)
    throw error
  }
}

export async function getRecentTransactions(
  userId: string,
  limit: number = 10
): Promise<Transaction[]> {
  try {
    const transactions = await getAllTransactions(userId)
    return transactions.slice(0, limit)
  } catch (error) {
    console.error('Error fetching recent transactions:', error)
    return []
  }
}

export async function getTodayTransactions(userId: string): Promise<Transaction[]> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return await getTransactionsByDateRange(userId, today, tomorrow)
  } catch (error) {
    console.error('Error fetching today transactions:', error)
    return []
  }
}
