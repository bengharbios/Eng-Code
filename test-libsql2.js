const { createClient } = require('@libsql/client');

try {
  createClient({ url: undefined });
} catch (e) {
  console.error("CAUGHT!", e.message);
}
