import { addIncome } from '../lib/income-service'

const PRIMARY_INCOME_2025 = [
  { month: 'May', amount: 29000 },
  { month: 'June', amount: 29000 },
  { month: 'July', amount: 29000 },
  { month: 'August', amount: 29000 },
  { month: 'September', amount: 29000 },
  { month: 'October', amount: 29000 },
  { month: 'November', amount: 29000 },
  { month: 'December', amount: 29000 },
  { month: 'January', amount: 36500 },
  { month: 'February', amount: 36500 },
]

const SECONDARY_INCOME_2025 = [
  { month: 'March', amount: 10500 },
  { month: 'April', amount: 9500 },
  { month: 'May', amount: 10000 },
  { month: 'June', amount: 10500 },
  { month: 'July', amount: 15400 },
  { month: 'August', amount: 16100 },
  { month: 'September', amount: 20300 },
  { month: 'October', amount: 15400 },
  { month: 'November', amount: 28700 },
  { month: 'December', amount: 32200 },
]

async function seedData() {
  console.log('🌱 Starting data seed...')
  
  try {
    // Add primary income
    console.log('Adding primary income entries...')
    for (const entry of PRIMARY_INCOME_2025) {
      await addIncome({
        amount: entry.amount,
        category: 'primary',
        month: entry.month,
        year: 2025,
        type: 'credit',
        description: 'Monthly salary',
      })
      console.log(`✅ Added ${entry.month} - ₹${entry.amount}`)
    }
    
    // Add secondary income
    console.log('\nAdding secondary income entries...')
    for (const entry of SECONDARY_INCOME_2025) {
      await addIncome({
        amount: entry.amount,
        category: 'secondary',
        month: entry.month,
        year: 2025,
        type: 'credit',
        description: 'Support & other income',
      })
      console.log(`✅ Added ${entry.month} - ₹${entry.amount}`)
    }
    
    console.log('\n✨ Data seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding data:', error)
    process.exit(1)
  }
}

seedData()
