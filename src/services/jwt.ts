import JWT from 'jsonwebtoken'
import { prismaClient } from "../clients/db";
import { User } from '@prisma/client';
const JWT_SECRET='$3456765432wdfbtr4ref';
class JWTService{
    public static generateTokenForUser(user:User){
        
        const payload={
            id:user?.id,
            email:user?.email
        }
        const token=JWT.sign(payload,JWT_SECRET);
        return token;
    }
}

export default JWTService;