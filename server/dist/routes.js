"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = void 0;
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const entry_routes_1 = __importDefault(require("./modules/entry/entry.routes"));
const category_routes_1 = __importDefault(require("./modules/category/category.routes"));
const summary_routes_1 = __importDefault(require("./modules/summary/summary.routes"));
const account_routes_1 = __importDefault(require("./modules/account/account.routes"));
const budget_routes_1 = __importDefault(require("./modules/budget/budget.routes"));
const API_V1 = '/api/v1';
const registerRoutes = (app) => {
    app.get('/health', (_, res) => res.json({ status: 'ok', service: 'abmiti-api' }));
    app.use(`${API_V1}/auth`, auth_routes_1.default);
    app.use(`${API_V1}/entries`, entry_routes_1.default);
    app.use(`${API_V1}/categories`, category_routes_1.default);
    app.use(`${API_V1}/summary`, summary_routes_1.default);
    app.use(`${API_V1}/accounts`, account_routes_1.default);
    app.use(`${API_V1}/budgets`, budget_routes_1.default);
};
exports.registerRoutes = registerRoutes;
//# sourceMappingURL=routes.js.map