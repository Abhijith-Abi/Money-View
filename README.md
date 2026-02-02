# Money View - Financial Income Tracker

A modern, beautiful financial income tracking web application built with Next.js, Firebase, and shadcn/ui.

## Features

- 📊 **Interactive Charts** - Visualize income with line, bar, area, and pie charts
- 💰 **Income Tracking** - Add and manage income entries by month/year
- 📈 **Statistics Dashboard** - View total income, averages, and trends
- 🎨 **Modern UI** - Glassmorphism design with smooth animations
- 🔥 **Firebase Backend** - Real-time data synchronization
- 📱 **Responsive** - Works beautifully on all devices

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase account (free tier works great)

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Copy your Firebase config
5. Create `.env.local` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: shadcn/ui
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Backend**: Firebase Firestore
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Language**: TypeScript

## Project Structure

```
Money-View/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main dashboard
│   └── globals.css         # Global styles
├── components/
│   ├── dashboard/
│   │   ├── stats-cards.tsx    # Stats display
│   │   ├── income-charts.tsx  # Chart components
│   │   ├── income-form.tsx    # Add income form
│   │   └── income-table.tsx   # Income list
│   └── ui/                    # shadcn components
├── lib/
│   ├── firebase.ts            # Firebase config
│   ├── income-service.ts      # Data operations
│   └── utils.ts               # Utilities
└── types/
    └── income.ts              # TypeScript types
```

## Usage

1. **Select Year**: Use the year dropdown to view data for different years
2. **Add Income**: Click the floating + button to add new entries
3. **View Charts**: Analyze your income trends in the charts section
4. **Manage Entries**: Delete entries from the table view

## License

MIT
