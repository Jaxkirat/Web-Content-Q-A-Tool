
# 🌐 AskWeb AI Chatbot

> A web-based tool that allows users to ingest content from any webpage and ask questions strictly based on that content. Powered by OpenAI embeddings + GPT, with a clean, minimal UI.

---

## Features

- Ingest one or more URLs and extract the key content.
- Ask natural language questions based **only on ingested content**.
- Smart, accurate answers (no general knowledge).
- Embedding-based RAG approach for better relevance.
- Lightweight, clean frontend UI.
- Fully deployable locally (no cloud dependencies).

---

## How It Works

### Content Ingestion:

- The backend uses **Axios** to fetch the raw HTML content of the provided URLs.
- The **Cheerio** library parses the HTML and extracts the meaningful text from sections like `<article>`, `<main>`, headings, lists, and paragraphs.
- The extracted text is then split into manageable chunks (~200 words each).
- Each chunk is converted into an embedding vector using OpenAI's **text-embedding-ada-002** model.
- All chunk embeddings are stored in memory.

### Retrieval & Answer Generation:

- When a user asks a question, the question is also converted into an embedding.
- Cosine similarity is computed between the question embedding and all content chunk embeddings.
- Top relevant chunks (above a similarity threshold) are selected.
- These chunks, along with the user question, are sent to OpenAI's **gpt-3.5-turbo** model.
- The model generates a concise, accurate answer strictly based on the ingested content.

---

## 🛠️ Setup Instructions (Local Deployment):

### 1️⃣ Backend:

1. Navigate to `/backend`:
   ```bash
   cd backend
   npm install
   ```

2. Create `.env` file in the `/backend` folder:
   ```
   OPENAI_API_KEY=sk-your-openai-key
   ```

3. Start the backend server:
   ```bash
   npm start
   ```

   Backend will run on `http://localhost:3000`

---

### 2️⃣ Frontend:

1. Navigate to `/frontend` folder.

2. Open `index.html` file in any text editor and update the backend URL:
   ```javascript
   let backendURL = 'http://localhost:3000';
   ```

3. Simply open `index.html` in your browser (double-click the file) and it will run locally.

---

## 💡 Usage:

1. Input one or more URLs.
2. Click **Ingest URLs** to scrape content.
3. Ask any question.
4. Get concise answers based only on the ingested webpage content.

---

## Demo Video:

Watch the demo video showcasing the tool in action:

### Cases Covered:

1. **Single URL Ingested**: Demonstrates ingesting and querying content from one webpage.
2. **Question Not in Context of the URL**: Shows how the app gracefully handles irrelevant queries.
3. **Multiple URLs Ingested**: Demonstrates ingesting content from multiple web pages and answering questions based on combined content.

https://github.com/user-attachments/assets/7653507e-bfb3-4bc0-9256-073404aafbec 

---

## 📜 License:
MIT License

---

## 👨‍💻 Credits:
Developed by Jaskirat Singh
