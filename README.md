# 🥏 Disc Golf Tracker

A modern, feature-rich disc golf round tracking application built with Next.js, Convex, Clerk, and shadcn/ui. Track your rounds, analyze your performance, connect with friends, and improve your game.

## ✨ Features

- **Round Tracking**: Track solo or group rounds with detailed hole-by-hole scoring
- **Real-time Maps**: Interactive maps with satellite view, showing tee and basket positions
- **Location Tracking**: Real-time distance to basket with location-based advice
- **Analytics & Statistics**: Performance charts, course comparison, and detailed insights
- **Social Features**: Friends system, leaderboards, and group rounds
- **Achievements & Goals**: Gamification with achievements and monthly goals
- **Mobile-First Design**: Optimized for mobile devices with responsive layout

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Convex (real-time database and backend functions)
- **Auth**: Clerk (authentication and user management)
- **Maps**: React Leaflet with satellite layers
- **Charts**: Recharts for data visualization

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Convex account
- Clerk account

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd discgolfP
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**

Create a `.env.local` file:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url_here

# Webhook (Optional)
CLERK_WEBHOOK_SECRET=your_webhook_secret_here
```

4. **Set up Convex:**
```bash
npx convex dev
```

5. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   └── ...          # Custom components
├── convex/          # Convex backend functions
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries
└── types/           # TypeScript definitions
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Deploy Convex

```bash
npx convex deploy
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npx convex dev` - Start Convex development mode
- `npx convex deploy` - Deploy Convex functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful component library
- **Convex** - Real-time database platform
- **Clerk** - Authentication service
- **Next.js** - React framework
- **Tailwind CSS** - Utility-first CSS

---

**Built with ❤️ for the disc golf community**
