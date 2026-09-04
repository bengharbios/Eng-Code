const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: 'libsql://englishcode-radiant-pisces-nw.aws-us-east-1.turso.io?authToken=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg1MzIzODAsImlkIjoiMDFhMDY3N2YtMjcwMS03MWFmLWI1NjctNDQyOTVlYzhjNDk0Iiwia2lkIjoiQjFIRm0wcnBPelNsMDR1eHZFaG51bmdRLWQyb0ZUeXJsdGU3bllUNm43VSIsInJpZCI6ImZlNjI5OGY0LTUxMDAtNDhiZi04ZTlhLWQwNGI1ZDZhMjIwMyJ9.tIrl9nlic_9zHPjJ4Usu7McWcyViK16vHS5v6MyramIZ8GxZESF7YrKAdKSVsBtTVGvX7CpHvkhzYXUWTptgAA'
});
prisma.$executeRawUnsafe('SELECT 1').then(console.log).catch(console.error);
