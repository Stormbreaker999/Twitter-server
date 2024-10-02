import axios from "axios";
import { prismaClient } from "../../clients/db";
import JWTService from "../../services/jwt";
import { User } from "@prisma/client";
import { GraphQLContext } from "../../interfaces";
import UserService from '../../services/user'
import {redisClient} from '../../clients/redis'
const queries={
    verifyGoogleToken:async(parent:any, {token}:{token: string})=>{
        const resultToken=await UserService.verifyGoogleAuthToken(token);
        return resultToken;
    },  
    getCurrentUser: async(parent:any, args:any, ctx:GraphQLContext)=>{
        const id=ctx?.user?.id;
        if(!id) return null;
        const user=await prismaClient.user.findUnique({where:{id:id.toString()}});
        console.log(user);
        return user;
    },
    getUserById: async(parent :any, {id}:{id:string}, ctx:GraphQLContext)=>{
        return UserService.getUserById(id);
    }
};

const extraResolvers={
    User:{
        tweets:(parent:User)=>prismaClient.tweet.findMany({ where:{author:{id:parent.id}}, orderBy:{createdAt:"desc"}}),
        followers:async(parent:User)=> {
            
            const result= prismaClient.follows.findMany({where:{following:{id:parent.id}},
                include:{
                    follower:true
                }
            });
            return (await result).map(el=>el.follower);
        },
        following:async(parent:User)=>{ 
            const result=await prismaClient.follows.findMany({where:{follower:{id:parent.id}},
                include:{
                    
                    following:true
                }
            });
            return result.map(el=>el.following);
        },
        recommendedUsers: async(parent:User, _any:any, ctx:GraphQLContext)=>{
            if(!ctx.user) return[];
            const cachedValue=await redisClient.get(`RECOMMENDED_USERS:${ctx.user.id}`);
            if(cachedValue) {
                
                return JSON.parse(cachedValue);}
            const myFollowing=await prismaClient.follows.findMany({
                where:{
                    follower:{id:ctx.user.id}
                },
                include:{
                    following: {include:{followers:{include:{following:true}}}}
                }
            })
            var users:User[]=[];
            for(const followings of myFollowing){
                for(const followingOfFollowedUser of followings.following.followers){
                    if(followingOfFollowedUser.following.id!==ctx.user.id &&
                        myFollowing.findIndex(e=>e?.followingId===followingOfFollowedUser.following.id)<0){
                        users.push(followingOfFollowedUser.following);
                    }
                }
            }
            await redisClient.setex(`RECOMMENDED_USERS:${ctx.user.id}`, 10, JSON.stringify(users))
            return users;
        }
    }
}
const mutations={
    followUser:async(parent:any, {to}:{to:string}, ctx:GraphQLContext)=>{
        if(!ctx.user || !ctx.user.id) throw new Error("unuthenticated user");
        await UserService.followUser(ctx.user.id,to);
        await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true;
    },
    unfollowUser:async(parent:any, {to}:{to:string}, ctx:GraphQLContext)=>{
        if(!ctx.user || !ctx.user.id) throw new Error("unuthenticated user");
        await UserService.unfollowUser(ctx.user.id,to);
        await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true;
    }
}
export const resolvers={queries, extraResolvers,mutations};