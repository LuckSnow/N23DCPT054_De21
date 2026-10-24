import { app } from './app.js';
import './models/db.js';
const port = Number(process.env.PORT || 5019);
app.listen(port, () => console.log(`API đang chạy tại http://localhost:${port}`));
