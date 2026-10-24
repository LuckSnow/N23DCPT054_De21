import { MongoClient } from 'mongodb';
import 'dotenv/config';

let client;
let database;

export async function connectDb() {
  if (database) return database;
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<db_username>') || uri.includes('<db_password>')) {
    throw new Error('Thiếu MONGODB_URI hợp lệ trong backend/.env.');
  }
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  database = client.db(process.env.MONGODB_DB_NAME || 'N23DCPT054_De21');
  await Promise.all([
    database.collection('the_loai').createIndex({ tenKey: 1 }, { unique: true }),
    database.collection('the_loai').createIndex({ id: 1 }, { unique: true }),
    database.collection('phim').createIndex({ tenKey: 1, namPhatHanh: 1 }, { unique: true }),
    database.collection('phim').createIndex({ id: 1 }, { unique: true }),
    database.collection('phim').createIndex({ theLoaiId: 1 })
  ]);
  for (const name of ['the_loai', 'phim']) {
    const latest = await database.collection(name).find({}).sort({ id: -1 }).limit(1).next();
    await database.collection('counters').updateOne({ _id: name }, { $max: { value: latest?.id || 0 } }, { upsert: true });
  }
  const largestReview = await database.collection('phim').aggregate([
    { $unwind: '$danhGia' }, { $group: { _id: null, value: { $max: '$danhGia.id' } } }
  ]).next();
  await database.collection('counters').updateOne({ _id: 'danh_gia' }, { $max: { value: largestReview?.value || 0 } }, { upsert: true });
  return database;
}
export function collection(name) {
  if (!database) throw new Error('MongoDB chưa kết nối.');
  return database.collection(name);
}
export async function closeDb() { await client?.close(); client = undefined; database = undefined; }
