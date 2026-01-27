# Project Documentation: Vakioveikkaus Full Stack App

## PART 1: Design & Wireframe (OSA 1)

### 1.1 Interface Overview (Rautalankamalli)
The application UI is split into two functional views to fulfill the core requirements:

* **Generation View (Päänäkymä):**
    * **Header**: "Vakioveikkaus".
    * **Input Grid**: 13 rows representing matches, each with three probability weight fields (1, X, 2).
    * **Row Selection**: Numeric input for selecting the number of rows to generate (1–5000).
    * **Controls**: "Generate & Save" (Ratkaisu) and "Shuffle" buttons.
    * **Results Area**: A dynamic list showing generated rows with headers repeated every 10 lines for readability.

* **History View:**
    * Displays a list of all previously saved generations from the database.
    * Includes timestamps and total row counts for each record.

**[PLACEHOLDER: Insert Application Screenshots Here]**

### 1.2 User Flow
1.  **Entry**: User navigates to the main generation screen.
2.  **Input**: User sets weights for 13 matches (e.g., 70% for '1', 20% for 'X', 10% for '2').
3.  **Generation**: User chooses row count and clicks "Generate".
4.  **Storage**: Backend calculates unique rows, saves the set to MongoDB Atlas, and returns the data.
5.  **Review**: User views generated rows on-screen or browses history.

### 1.3 Data Design (Datan suunnittelu)
* **Frontend → Backend**: Transmits match weights and requested row count via JSON.
* **Backend → Frontend**: Returns an object containing the generated rows, row count, and requested count.
* **Database Schema**:
    * `InputModel`: Stores the current state of match weights.
    * `OutputModel`: Stores generated row sets with timestamps.

---

## PART 2: Technical Setup (README)

### Tech Stack
* **Frontend**: React 19 (Vite).
* **Backend**: Node.js + Express.
* **Database**: MongoDB Atlas.

### Installation
1.  **Check Environment**:
    ```bash
    node -v # Expected >= 18.x
    npm -v
    ```
2.  **Configure Database**:
    Create `backend/.env` with your connection string:
    `MONGODB_URI=your_atlas_uri`
    `API_PORT=3500`

3.  **Install & Run**:
    ```bash
    # Backend
    cd backend && npm install && node server.js

    # Frontend
    cd frontend && npm install && npm run dev
    ```