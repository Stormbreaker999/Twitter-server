import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import bodyParser from "body-parser";
import cors from "cors";
import { prismaClient } from "../clients/db";
import { User } from "./user";
import { GraphQLContext } from "../interfaces";
import JWTService from "../services/jwt";
import { Tweet } from "./tweet";


export const initServer = async () => {
	const app = express();
	app.use(cors());
	app.use(bodyParser.json());
	
	//For health cheaking with AWS.
	const graphqlServer = new ApolloServer<GraphQLContext>({
		typeDefs:`
			${User.types}
			${Tweet.types}
			type Query{
            	${User.queries}
				${Tweet.queries}
			}
			type Mutation {
				${Tweet.mutations}
				${User.mutations}
			}
			`
		,

		resolvers: {
			Query: {
				...User.resolvers.queries,
				...Tweet.resolvers.queries,
			},
			Mutation:{
				...Tweet.resolvers.mutations,
				...User.resolvers.mutations,
			},
			...Tweet.resolvers.extraResolvers,
			...User.resolvers.extraResolvers,
			
		},
	});
	await graphqlServer.start();

	app.use(
		"/graphql",
		expressMiddleware(graphqlServer, {
			context: async ({ req, res }) => ({
				user: req.headers.authorization
					? await JWTService.decodeToken(
							req.headers.authorization.split("Bearer ")[1]
					  )
					: undefined,
			}),
		})
	);
	return app;
};