const { createClient } = require('@libsql/client');

try {
  const libsql = createClient({
    url: "libsql://database-yellow-button-vercel-icfg-16naipzg5tbpfaiz1ny2dv98.aws-us-east-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3ODkxMzc3MjIsImlhdCI6MTc4ODUzMjkyMiwiaWQiOiIwMWEwNjc1Yy04YTAxLTc5MTMtYjUxNi1iMTQ5OTI4ZDBiOTciLCJraWQiOiJ6TWY4dk0tcUl6aWxFNlczYTUtWkUxNldWdkdSNE9LUGdGVUc5X3Z6elE0IiwicmlkIjoiMGY5NDE5OGQtNTU2OS00MDYwLTkyOWQtZTAyOTdjODk0OTVhIn0.ypuClb6jnIgAh3E2b7LS2KoKNk6oIaGzkl8eT6LMchBLCE7etY0dqhJXhz3j-Hmm6oHGF229bFJjAcFItCqdCQ"
  });
  
  libsql.execute("SELECT 1").then(console.log).catch(console.error);
} catch (e) {
  console.error("Init error", e);
}
