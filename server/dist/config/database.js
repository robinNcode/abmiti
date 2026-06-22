"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
// Backward-compat shim — business code should use the infrastructure layer directly.
// app.ts calls connectDB() which routes to the correct provider based on DB_PROVIDER.
var connection_1 = require("../infrastructure/database/mongodb/connection");
Object.defineProperty(exports, "connectDB", { enumerable: true, get: function () { return connection_1.connectMongoDB; } });
//# sourceMappingURL=database.js.map