# BodAI - AI Body Language Analyzer and Coach

A full-stack web application that uses AI to analyze body language in videos and provide personalized coaching feedback.

## Features

- 🎥 **Video Analysis**: Upload videos and get AI-powered body language analysis
- 📊 **Dashboard**: View your analysis history with accordion-style insights
- 🎯 **Personalized Feedback**: Tailored analysis based on your goals (interviews, presentations, confidence, etc.)
- 📚 **Course Recommendations**: (Coming soon) Structured courses for improvement
- 🔐 **Authentication**: Secure user accounts with Clerk
- 💾 **Database**: Persistent storage with Supabase

## Tech Stack

### Frontend
- React.js
- Clerk (Authentication)
- React Markdown (Results display)

### Backend
- Node.js + Express
- Google Gemini API (AI Analysis)
- Supabase (Database)
- Multer (File uploads)

## Setup Instructions

### 1. Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account
- Google Gemini API key
- Clerk account

### 2. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd client
npm install
cd ..
```

### 3. Environment Variables

Create `.env` in root directory:

```env
# Google Gemini API
API_KEY=your_gemini_api_key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
```

Create `client/.env`:

```env
# Clerk Authentication
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Optional
REACT_APP_API_URL=http://localhost:5000
```

### 4. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run the SQL from `supabase/schema.sql`
4. See `SUPABASE_SETUP.md` for detailed instructions

### 5. Run the Application

**Development:**

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npm run client
```

Visit `http://localhost:3000`

## Project Structure

```
BodAI/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── UploadVideo.jsx
│   │   │   ├── AnalysisResult.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   └── OnboardingPage.jsx
│   │   └── App.js
│   └── package.json
├── services/
│   ├── geminiService.js    # Gemini API integration
│   └── supabaseService.js  # Database operations
├── supabase/
│   └── schema.sql          # Database schema
├── server.js               # Express backend
└── package.json
```

## User Flow

1. **Sign Up/Login** → Clerk authentication
2. **Onboarding** → Answer questions about goals (first time only)
3. **Dashboard** → View analysis history
4. **New Analysis** → Upload video → Get AI feedback
5. **View Results** → See detailed analysis with strengths, improvements, recommendations

## API Endpoints

- `POST /api/analyze-video` - Analyze uploaded video
- `GET /api/analyses` - Get user's analysis history
- `GET /api/analyses/:id` - Get specific analysis

## Next Steps

- [ ] Course system implementation
- [ ] Payment integration (Stripe)
- [ ] Progress tracking
- [ ] Advanced insights dashboard
- [ ] Video storage optimization

## License

Private project

