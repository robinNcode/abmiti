// Backward-compat shim — business code should use the infrastructure layer directly.
// app.ts calls connectDB() which routes to the correct provider based on DB_PROVIDER.
export { connectMongoDB as connectDB } from '../infrastructure/database/mongodb/connection';
