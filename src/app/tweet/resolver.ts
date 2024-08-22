import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphQLContext } from "../../interfaces";
import { redisClient } from "../../clients/redis";
interface CreateTweetPayload{
    content: string;
    imageURL?: string;
}

const queries={
    getAllTweets:async()=>{
        const cachedTweets=await redisClient.get('ALL_TWEETS');
        if(cachedTweets) return JSON.parse(cachedTweets);
        const tweets= await prismaClient.tweet.findMany({orderBy:{createdAt:"desc"}});
        await redisClient.set('ALL_TWEETS', JSON.stringify(tweets));
        return tweets;
    }
}
const mutations={
    createTweet: async(parent:any, {payload}:{payload:CreateTweetPayload}, ctx: GraphQLContext)=>{
        if(!ctx.user) throw new Error("You are not authenticated");
        const rateLimitFlag=await redisClient.get(`RATE_LIMIT:TWEET:${ctx.user.id}`);
        if(rateLimitFlag) throw new Error("Please wait ...");
        const tweet=await prismaClient.tweet.create({
            data:{
                content:payload.content,
                imageURL:payload.imageURL,
                author:{connect:{id:ctx.user.id}}
            }
        });
        await redisClient.setex(`RATE_LIMIT:TWEET:${ctx.user.id}`,10, 1);
        await redisClient.del('ALL_TWEETS');
        return tweet;
    }
}

const extraResolvers={
    Tweet:{
        author:(parent:Tweet)=>prismaClient.user.findUnique({where:{id:parent.authorId}})
    }
}
export const resolvers={mutations, extraResolvers, queries};