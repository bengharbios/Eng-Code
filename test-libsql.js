const { createClient } = require('@libsql/client');

try {
  const libsql = createClient({
    url: "libsql://database-yellow-button-vercel-icfg-16naipzg5tbpfaiz1ny2dv98.aws-us-east-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3ODg1MzAyOTAsImlhdCI6MTc4ODQ0Mzg5MCwiaWQiOiIwMWEwNjc1Yy04YTAxLTc5MTMtYjUxNi1iMTQ5OTI4ZDBiOTciLCJraWQiOiJ6TWY4dk0tcUl6aWxFNlczYTUtWkUxNldWdkdSNE9LUGdGVUc5X3Z6elE0IiwicmlkIjoiMGY5NDE5OGQtNTU2OS00MDYwLTkyOWQtZTAyOTdjODk0OTVhIn0.bwxfZSKpmBtK9zgjq1j4Kw4kjiWkDOXdHGGK3kYVJFQk93s2fCBRpAw8VlrM1a4d5r70tzs5LfO5SzuaMR5_DA"
  });
  
  libsql.execute("SELECT 1").then(console.log).catch(console.error);
} catch (e) {
  console.error("Init error", e);
}
