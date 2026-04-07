import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = Number(process.env.PORT || 4100);
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Gallery YAML Manager running at http://${HOST}:${PORT}`);
});
