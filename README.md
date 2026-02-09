# Exam Oefenen

A practice application for the Dutch Inburgeringsexamen (A2 level). Practice Reading, Listening, Writing, Speaking, and KNM (Knowledge of Dutch Society) exams with AI-powered generation and validation.

## Preview

|                Exam Selection                |              Exam in Progress              |                 Results                  |
| :------------------------------------------: | :----------------------------------------: | :--------------------------------------: |
| ![Exam Selection](assets/exam-selection.png) | ![Exam Progress](assets/exam-progress.png) | ![Exam Results](assets/exam-results.png) |

## Setup

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd exam-oefenen
```

1. Install dependencies:

```bash
npm install
```

This will automatically install dependencies for both the client and server via the `postinstall` script.

### Environment Variables

You have two options to configure the Gemini API:

#### Option 1: Using the UI (Recommended for Users)

No configuration needed! When you start the application:

1. Navigate to the exam selection page
2. Click the **settings icon (⚙️)** in the header
3. Enter your Gemini API key
4. Select your preferred model (default: `gemini-2.5-flash`)
5. Optionally check "Remember settings" to save in browser localStorage

The settings modal also appears automatically when you click **START** if no API configuration is detected.

Get your free API key at [Google AI Studio](https://makersuite.google.com/app/apikey).

**Available Models:**
- `gemini-2.5-flash` (Default - Fast and efficient)
- `gemini-2.5-pro` (More capable)
- `gemini-1.5-flash`
- `gemini-1.5-pro`

#### Option 2: Using Environment Variables (Recommended for Developers)

Create a `.env` file in the project root:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
GEMINI_MODEL=gemini-2.5-flash  # Default: gemini-2.5-flash
```

**Note:** Client-side settings (via UI) will override server-side environment variables.

### Running the Application

Start both client and server concurrently:

```bash
npm start
```

This will start:

- **Client** (Angular) on `http://localhost:4400`
- **Server** (Express) on `http://localhost:3000`

To stop all services:

```bash
npm run stop
```
