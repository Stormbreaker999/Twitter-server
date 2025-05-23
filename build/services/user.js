"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../clients/db");
const jwt_1 = __importDefault(require("./jwt"));
class UserService {
    static async verifyGoogleAuthToken(token) {
        const googleToken = token;
        console.log(googleToken);
        const googleOauthURL = new URL('https://oauth2.googleapis.com/tokeninfo');
        googleOauthURL.searchParams.set('id_token', googleToken);
        const { data } = await axios_1.default.get(googleOauthURL.toString(), {
            responseType: 'json'
        });
        const user = await db_1.prismaClient.user.findUnique({
            where: { email: data.email }
        });
        if (!user) {
            await db_1.prismaClient.user.create({
                data: {
                    email: data.email,
                    firstName: data.given_name,
                    lastName: data.family_name,
                    profileImageURL: data.picture
                }
            });
        }
        const userInDb = await db_1.prismaClient.user.findUnique({ where: { email: data.email } });
        if (!userInDb)
            throw new Error('User with email not found');
        const jwttoken = jwt_1.default.generateTokenForUser(userInDb);
        return jwttoken;
    }
    static getUserById(id) {
        return db_1.prismaClient.user.findUnique({ where: { id } });
    }
    static followUser(from, to) {
        return db_1.prismaClient.follows.create({
            data: {
                follower: { connect: { id: from } },
                following: { connect: { id: to } }
            }
        });
    }
    static unfollowUser(from, to) {
        return db_1.prismaClient.follows.delete({
            where: { followerId_followingId: { followerId: from, followingId: to } }
        });
    }
}
exports.default = UserService;
