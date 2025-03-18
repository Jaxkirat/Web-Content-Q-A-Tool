const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

let contentChunks = [];
let contentEmbeddings = [];

const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Utility: Cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Clean and extract main content
function extractMainContent(html) {
  const $ = cheerio.load(html);
  let content = '';

  // Target main content sections
  const selectors = ['article', 'main', '.content', '.post-content', '.entry-content'];

  selectors.forEach(selector => {
    $(selector).each((_, el) => {
      content += $(el).text().trim() + '\n';
    });
  });

  // Fallback to headings and paragraphs if empty
  if (content.trim().length < 100) {
    $('h1, h2, h3, p, ul li, ol li').each((_, el) => {
      content += $(el).text().trim() + '\n';
    });
  }

  return content.replace(/\s{2,}/g, ' ').slice(0, 10000); // Limit size
}

// Split content into manageable chunks
function chunkContent(content, maxWords = 200) {
  const sentences = content.split(/(?<=[.!?])\s+/);
  let chunks = [];
  let chunk = '';

  sentences.forEach(sentence => {
    if ((chunk + sentence).split(' ').length > maxWords) {
      chunks.push(chunk);
      chunk = sentence + ' ';
    } else {
      chunk += sentence + ' ';
    }
  });

  if (chunk.trim().length > 0) {
    chunks.push(chunk);
  }

  return chunks;
}

// Generate embedding for text
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

// INGEST ENDPOINT
app.post('/ingest', async (req, res) => {
  try {
    const urls = req.body.urls.split(',').map(url => url.trim());
    let combinedContent = '';

    for (const url of urls) {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      });
      const cleaned = extractMainContent(data);
      combinedContent += cleaned + '\n';
    }

    contentChunks = chunkContent(combinedContent);
    contentEmbeddings = [];

    // Generate embeddings for each chunk
    for (const chunk of contentChunks) {
      const embedding = await generateEmbedding(chunk);
      contentEmbeddings.push(embedding);
    }

    res.json({ message: 'Ingestion complete!' });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Failed to ingest URLs.' });
  }
});

// ASK ENDPOINT WITH THRESHOLD
app.post('/ask', async (req, res) => {
  try {
    const question = req.body.question;
    const questionEmbedding = await generateEmbedding(question);

    // Compute similarity for each chunk
    const similarities = contentEmbeddings.map(embedding => cosineSimilarity(questionEmbedding, embedding));

    // Apply similarity threshold
    const threshold = 0.75;
    const filteredChunks = contentChunks
      .map((chunk, index) => ({ chunk, score: similarities[index] }))
      .filter(obj => obj.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (filteredChunks.length === 0) {
      return res.json({ answer: "Sorry, the provided URLs do not contain relevant information to answer your question." });
    }

    const context = filteredChunks.map(obj => obj.chunk).join('\n---\n');

    const prompt = `
You are a smart assistant. ONLY answer using the following content. Do NOT use external knowledge, do NOT suggest looking elsewhere. Format answers clearly.

CONTENT:
"""
${context}
"""

Question: ${question}

Strictly answer based on CONTENT:
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    });

    const answer = completion.choices[0].message.content.trim();
    res.json({ answer });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Error processing question.' });
  }
});

// START SERVER
app.listen(3000, () => console.log('Server running on port 3000'));
