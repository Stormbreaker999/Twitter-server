export const mutations=`#graphql
    createTweet(payload: CreateTweetData!): Tweet
    likeTweet(id: String!): Boolean
`