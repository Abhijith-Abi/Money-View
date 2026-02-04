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
import { Customer, CustomerStats } from '@/types/customer'

const COLLECTION_NAME = 'customers'

export async function addCustomer(
  customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'currentBalance'>,
  userId: string
): Promise<string> {
  try {
    const dataToWrite = {
      ...customer,
      userId,
      currentBalance: customer.openingBalance,
      createdAt: (customer as any).date 
        ? Timestamp.fromDate((customer as any).date) 
        : Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToWrite)
    console.log('Customer added successfully with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error adding customer:', error)
    throw error
  }
}

export async function updateCustomer(
  id: string,
  userId: string,
  updates: Partial<Omit<Customer, 'id' | 'createdAt' | 'userId'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
    console.log('Customer updated successfully for ID:', id)
  } catch (error) {
    console.error('Error updating customer:', error)
    throw error
  }
}

export async function deleteCustomer(id: string, userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id))
  } catch (error) {
    console.error('Error deleting customer:', error)
    throw error
  }
}

export async function getCustomer(id: string, userId: string): Promise<Customer | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists() && docSnap.data().userId === userId) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as Customer
    }
    
    return null
  } catch (error) {
    console.error('Error fetching customer:', error)
    throw error
  }
}

export async function getAllCustomers(userId: string): Promise<Customer[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('name', 'asc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Customer[]
  } catch (error) {
    console.error('Error fetching customers:', error)
    throw error
  }
}

export async function searchCustomers(
  userId: string,
  searchTerm: string
): Promise<Customer[]> {
  try {
    const customers = await getAllCustomers(userId)
    const term = searchTerm.toLowerCase()
    
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        customer.email?.toLowerCase().includes(term)
    )
  } catch (error) {
    console.error('Error searching customers:', error)
    throw error
  }
}

export async function filterCustomersByStatus(
  userId: string,
  status: 'active' | 'inactive'
): Promise<Customer[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('name', 'asc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Customer[]
  } catch (error) {
    console.error('Error filtering customers:', error)
    throw error
  }
}

export async function getCustomerStats(userId: string): Promise<CustomerStats> {
  try {
    const customers = await getAllCustomers(userId)
    
    const stats: CustomerStats = {
      totalCustomers: customers.length,
      activeCustomers: customers.filter((c) => c.status === 'active').length,
      inactiveCustomers: customers.filter((c) => c.status === 'inactive').length,
      totalReceivables: customers
        .filter((c) => c.currentBalance > 0)
        .reduce((sum, c) => sum + c.currentBalance, 0),
      totalPayables: customers
        .filter((c) => c.currentBalance < 0)
        .reduce((sum, c) => sum + Math.abs(c.currentBalance), 0),
    }
    
    return stats
  } catch (error) {
    console.error('Error calculating customer stats:', error)
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      inactiveCustomers: 0,
      totalReceivables: 0,
      totalPayables: 0,
    }
  }
}

export async function updateCustomerBalance(
  customerId: string,
  userId: string,
  newBalance: number
): Promise<void> {
  try {
    await updateCustomer(customerId, userId, { currentBalance: newBalance })
  } catch (error) {
    console.error('Error updating customer balance:', error)
    throw error
  }
}
