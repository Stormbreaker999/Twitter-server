"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const db_1 = require("../../clients/db");
const user_1 = __importDefault(require("../../services/user"));
const redis_1 = require("../../clients/redis");
const queries = {
    verifyGoogleToken: async (parent, { token }) => {
        const resultToken = await user_1.default.verifyGoogleAuthToken(token);
        return resultToken;
    },
    getCurrentUser: async (parent, args, ctx) => {
        const id = ctx?.user?.id;
        if (!id)
            return null;
        const user = await db_1.prismaClient.user.findUnique({ where: { id: id.toString() } });
        console.log(user);
        return user;
    },
    getUserById: async (parent, { id }, ctx) => {
        return user_1.default.getUserById(id);
    }
};
const extraResolvers = {
    User: {
        tweets: (parent) => db_1.prismaClient.tweet.findMany({ where: { author: { id: parent.id } }, orderBy: { createdAt: "desc" } }),
        followers: async (parent) => {
            const result = db_1.prismaClient.follows.findMany({ where: { following: { id: parent.id } },
                include: {
                    follower: true
                }
            });
            return (await result).map(el => el.follower);
        },
        following: async (parent) => {
            const result = await db_1.prismaClient.follows.findMany({ where: { follower: { id: parent.id } },
                include: {
                    following: true
                }
            });
            return result.map(el => el.following);
        },
        recommendedUsers: async (parent, _any, ctx) => {
            if (!ctx.user)
                return [];
            const cachedValue = await redis_1.redisClient.get(`RECOMMENDED_USERS:${ctx.user.id}`);
            if (cachedValue) {
                return JSON.parse(cachedValue);
            }
            const myFollowing = await db_1.prismaClient.follows.findMany({
                where: {
                    follower: { id: ctx.user.id }
                },
                include: {
                    following: { include: { followers: { include: { following: true } } } }
                }
            });
            var users = [];
            for (const followings of myFollowing) {
                for (const followingOfFollowedUser of followings.following.followers) {
                    if (followingOfFollowedUser.following.id !== ctx.user.id &&
                        myFollowing.findIndex(e => e?.followingId === followingOfFollowedUser.following.id) < 0) {
                        users.push(followingOfFollowedUser.following);
                    }
                }
            }
            await redis_1.redisClient.setex(`RECOMMENDED_USERS:${ctx.user.id}`, 10, JSON.stringify(users));
            return users;
        }
    }
};
const mutations = {
    followUser: async (parent, { to }, ctx) => {
        if (!ctx.user || !ctx.user.id)
            throw new Error("unuthenticated user");
        await user_1.default.followUser(ctx.user.id, to);
        await redis_1.redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true;
    },
    unfollowUser: async (parent, { to }, ctx) => {
        if (!ctx.user || !ctx.user.id)
            throw new Error("unuthenticated user");
        await user_1.default.unfollowUser(ctx.user.id, to);
        await redis_1.redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true;
    }
};
exports.resolvers = { queries, extraResolvers, mutations };
