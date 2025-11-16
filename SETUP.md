# BodAI Setup Instructions

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Clerk account (for authentication)
- Google Gemini API key

## Setup Steps

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Google Gemini API Key
API_KEY=your_gemini_api_key_here

# Clerk Authentication
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Optional: Backend port (default: 5000)
PORT=5000

# Optional: Frontend origin for CORS (default: http://localhost:3000)
CLIENT_ORIGIN=http://localhost:3000
```

### 3. Set Up Clerk

**Official Documentation:** [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react)

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Go to [API keys page](https://dashboard.clerk.com/last-active?path=api-keys) in your Clerk Dashboard
4. Choose **React** and copy your Publishable Key
5. Add it to `.env` as `REACT_APP_CLERK_PUBLISHABLE_KEY`
6. Configure Clerk authentication methods (Email, Google, etc.)

**Important Notes:**
- This project uses **React Scripts (create-react-app)**, so we use `REACT_APP_` prefix for environment variables
- If you were using **Vite**, you would use `VITE_CLERK_PUBLISHABLE_KEY` instead
- The Publishable Key must be set, or the app will throw an error on startup
- Store real keys only in `.env` (not tracked in git) - use placeholders in documentation

### 4. Run the Application

**Development Mode:**

Terminal 1 (Backend):
```bash
npm run dev
```

Terminal 2 (Frontend):
```bash
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

**Production Mode:**

```bash
# Build the React app
npm run build

# Start the server
npm start
```

## Features

### Authentication
- Users must sign in before uploading videos
- Clerk handles all authentication flows
- User profile management via UserButton

### Onboarding Questions
- Users answer questions about their goals before analysis
- Questions include:
  - Primary goal (confidence, interview, presentation, etc.)
  - Confidence level (optional)
- Answers are used to personalize the AI analysis

### Personalized Analysis
- AI analysis is tailored based on user's stated goals
- Different prompts for different objectives
- More relevant and actionable feedback

## Project Structure

```
BodAI/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Header.jsx
│   │   │   ├── hero/
│   │   │   │   └── Hero.jsx
│   │   │   ├── OnboardingQuestions.jsx
│   │   │   ├── UploadVideo.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── AnalysisResult.jsx
│   │   │   └── LoadingView.jsx
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── services/
│   └── geminiService.js    # Gemini API integration
├── server.js               # Express backend
├── package.json
└── .env                    # Environment variables
```

## Troubleshooting

### Clerk Not Working
- Make sure `REACT_APP_CLERK_PUBLISHABLE_KEY` is set correctly
- Check Clerk dashboard for API key
- Ensure Clerk app is configured properly

### API Errors
- Verify `API_KEY` is set in `.env`
- Check Gemini API quota and limits
- Review server logs for detailed error messages

### CORS Issues
- Ensure `CLIENT_ORIGIN` matches your frontend URL
- Check that backend is running on correct port

## Next Steps

1. Add course recommendations after analysis
2. Implement user progress tracking
3. Add payment integration for courses
4. Enhance onboarding with more questions
5. Add analytics and user insights

