# 💊 PharmAId

> **Your comprehensive, AI-driven companion for pharmacy education and clinical practice.**  
> *Built for the Google AI Studio Hackathon.*

PharmAId is a modern, responsive web application designed to assist pharmacy students and professionals. Powered by the **Google Gemini API** (2.5 Flash), it offers intelligent study tools, clinical safety checks, and an interactive, gamified patient counseling simulator. 

## ✨ Key Features

### 📚 Learn Module
A smart clinical notebook designed to accelerate learning.
- **PDF Extraction**: Upload text-based PDFs and instantly extract clinical guidelines or study materials into your notes.
- **Grounded AI Q&A**: Ask Gemini context-aware questions about your specific notes. The AI will strictly use your note content to answer, preventing hallucinations.
- **Cloud Sync**: Optional Google Sign-In via Firebase to securely save your notes across sessions. Seamless ephemeral use for quick testing!

### ⚕️ Clinical Support Module
A precision tool for drug safety analysis.
- **Interaction Checker**: Input multiple drugs to generate a comprehensive AI analysis of potential drug-drug interactions.
- **Structured Risk Assessment**: Returns strict JSON-structured data displaying the overall risk level, severity per interaction, and actionable clinical management recommendations.

### 🎭 Simulate Module
A gamified patient counseling simulator to practice communication skills.
- **Dynamic Scenarios**: Automatically generates realistic patient profiles and clinical scenarios.
- **Real-Time Roleplay**: Chat with an AI-driven patient that responds dynamically to your counseling approach.
- **Gamified Feedback**: End the session to receive a comprehensive evaluation including an overall score, badges earned (e.g., *Active Listener*, *Empathy Expert*), and detailed feedback on clinical accuracy, empathy, and areas to improve.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+ (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **AI Integration**: [@google/genai SDK](https://www.npmjs.com/package/@google/genai) (Gemini 2.5 Flash)
- **Backend & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Google Auth)
- **Document Parsing**: [pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

To run PharmAId locally, follow these steps:

### 1. Clone the repository
```bash
git clone <repository-url>
cd pharmaid
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory and add the following keys. (See `.env.example` for reference).

```env
# Gemini API Setup
# Get your key at: https://aistudio.google.com/
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

*Note: Firebase configuration is automatically handled via the included `firebase-applet-config.json` if you are using the pre-configured project, or you can supply your own standard Firebase web credentials if decoupling from the provided backend.*

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📁 Project Structure

- `/app` - Next.js App Router entry points and global styling.
- `/components` - Reusable React components containing the core module logic (`LearnDashboard`, `ClinicalPage`, `SimulatePage`).
- `/services` - Integrations for external APIs:
  - `geminiService.ts`: Core AI logic, prompt engineering, and structured JSON parsing.
  - `firestoreService.ts`: Database CRUD operations.
- `/contexts` - Global state management (e.g., `AuthContext.tsx`).
- `/lib` - Utility functions (e.g., PDF extraction helper).

---

## 🔐 Security & Data

- Database interactions are secured with hardened **Firestore Security Rules** ensuring users can only read, list, update, and delete their own clinical notes.
- Ephemeral state handling is implemented to allow guest users to fully test standard app functionality (like AI Simulation and Note Extraction) without creating an account. 

---

### License
MIT License
