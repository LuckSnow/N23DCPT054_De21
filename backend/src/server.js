import { app } from './app.js';
import { connectDb } from './models/db.js';
const port = Number(process.env.PORT || 5019);
try {
  await connectDb();
  app.listen(port, () => console.log(`API đang chạy tại http://localhost:${port}`));
} catch (error) {
  console.error('Không kết nối được MongoDB:', error.message);
  process.exitCode = 1;
}
