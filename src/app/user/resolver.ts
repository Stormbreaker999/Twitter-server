import axios from "axios";
import { prismaClient } from "../../clients/db";
import JWTService from "../../services/jwt";
import { User } from "@prisma/client";
import { GraphQLContext } from "../../interfaces";
interface GoogleTokenResult{
    
    iss?: string,
    azp?: string,
    aud?: string,
    sub?: string,
    email: string,
    email_verified?: string,
    nbf?: string,
    name?: string,
    picture?: string,
    given_name: string,
    family_name?: string,
    iat?: string,
    exp?: string,
    jti?: string,
    alg?: string,
    kid?: string,
    typ?: string

}
const queries={
    verifyGoogleToken:async(parent:any, {token}:{token: string})=>{
        const googleToken=token;
        console.log(googleToken);
        const googleOauthURL=new URL('https://oauth2.googleapis.com/tokeninfo');
        googleOauthURL.searchParams.set('id_token',googleToken);    
        const {data}=await axios.get<GoogleTokenResult>(googleOauthURL.toString(),{
            responseType:'json'
        })

        const user=await prismaClient.user.findUnique({
            where:{email:data.email}
        })
        if(!user){
            await prismaClient.user.create({
                data:{
                    email:data.email,
                    firstName:data.given_name,
                    lastName:data.family_name,
                    profileImageURL:data.picture
                }
            })
        }
        const userInDb=await prismaClient.user.findUnique({where:{email:data.email}});
        if(!userInDb) throw new Error('User with email not found');
        const jwttoken=JWTService.generateTokenForUser(userInDb);
        return jwttoken;
    },  
    getCurrentUser: async(parent:any, args:any, ctx:GraphQLContext)=>{
        const id=ctx?.user?.id;
        if(!id) return null;
        const user=await prismaClient.user.findUnique({where:{id:id.toString()}});
        console.log(user);
        return user;
    }
};

export const resolvers={queries};