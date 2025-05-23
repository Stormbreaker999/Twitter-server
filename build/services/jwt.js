"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = '$3456765432wdfbtr4ref';
class JWTService {
    static generateTokenForUser(user) {
        const payload = {
            id: user?.id,
            email: user?.email
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET);
        return token;
    }
    static decodeToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (error) {
            return null;
        }
    }
}
exports.default = JWTService;
