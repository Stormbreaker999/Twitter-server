export interface JWTUser{
    id:String;
    email:String;
}
export interface GraphQLContext{
    user?:JWTUser;
}