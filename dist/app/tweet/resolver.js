"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const db_1 = require("../../clients/db");
const redis_1 = require("../../clients/redis");
const queries = {
    getAllTweets: async () => {
        const cachedTweets = await redis_1.redisClient.get('ALL_TWEETS');
        if (cachedTweets)
            return JSON.parse(cachedTweets);
        const tweets = await db_1.prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } });
        await redis_1.redisClient.set('ALL_TWEETS', JSON.stringify(tweets));
        return tweets;
    },
};
const mutations = {
    createTweet: async (parent, { payload }, ctx) => {
        if (!ctx.user)
            throw new Error("You are not authenticated");
        const rateLimitFlag = await redis_1.redisClient.get(`RATE_LIMIT:TWEET:${ctx.user.id}`);
        if (rateLimitFlag)
            throw new Error("Please wait ...");
        const tweet = await db_1.prismaClient.tweet.create({
            data: {
                content: payload.content,
                imageURL: payload.imageURL,
                author: { connect: { id: ctx.user.id } }
            }
        });
        await redis_1.redisClient.setex(`RATE_LIMIT:TWEET:${ctx.user.id}`, 10, 1);
        await redis_1.redisClient.del('ALL_TWEETS');
        return tweet;
    },
    likeTweet: async (parent, { id }, ctx) => {
        if (!ctx.user)
            throw new Error("You are not authenticated");
        await db_1.prismaClient.likes.create({
            data: {
                likedBy: { connect: { id: ctx.user?.id } },
                likedTweet: { connect: { id: id } }
            }
        });
        return true;
    }
};
const extraResolvers = {
    Tweet: {
        author: (parent) => db_1.prismaClient.user.findUnique({ where: { id: parent.authorId } }),
        usersLiked: async (parent) => {
            const result = db_1.prismaClient.likes.findMany({ where: { likedTweet: { id: parent.id } },
                include: {
                    likedBy: true
                }
            });
            return (await result).map(el => el.likedBy);
        }
    }
};
exports.resolvers = { mutations, extraResolvers, queries };
