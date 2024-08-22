"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const db_1 = require("../../clients/db");
const redis_1 = require("../../clients/redis");
const queries = {
    getAllTweets: () => __awaiter(void 0, void 0, void 0, function* () {
        const cachedTweets = yield redis_1.redisClient.get('ALL_TWEETS');
        if (cachedTweets)
            return JSON.parse(cachedTweets);
        const tweets = yield db_1.prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } });
        yield redis_1.redisClient.set('ALL_TWEETS', JSON.stringify(tweets));
        return tweets;
    })
};
const mutations = {
    createTweet: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { payload }, ctx) {
        if (!ctx.user)
            throw new Error("You are not authenticated");
        const rateLimitFlag = yield redis_1.redisClient.get(`RATE_LIMIT:TWEET:${ctx.user.id}`);
        if (rateLimitFlag)
            throw new Error("Please wait ...");
        const tweet = yield db_1.prismaClient.tweet.create({
            data: {
                content: payload.content,
                imageURL: payload.imageURL,
                author: { connect: { id: ctx.user.id } }
            }
        });
        yield redis_1.redisClient.setex(`RATE_LIMIT:TWEET:${ctx.user.id}`, 10, 1);
        yield redis_1.redisClient.del('ALL_TWEETS');
        return tweet;
    })
};
const extraResolvers = {
    Tweet: {
        author: (parent) => db_1.prismaClient.user.findUnique({ where: { id: parent.authorId } })
    }
};
exports.resolvers = { mutations, extraResolvers, queries };
