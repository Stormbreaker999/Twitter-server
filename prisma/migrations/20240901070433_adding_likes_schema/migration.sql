-- CreateTable
CREATE TABLE "Likes" (
    "likedById" TEXT NOT NULL,
    "likedTweetId" TEXT NOT NULL,

    CONSTRAINT "Likes_pkey" PRIMARY KEY ("likedById","likedTweetId")
);

-- AddForeignKey
ALTER TABLE "Likes" ADD CONSTRAINT "Likes_likedById_fkey" FOREIGN KEY ("likedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Likes" ADD CONSTRAINT "Likes_likedTweetId_fkey" FOREIGN KEY ("likedTweetId") REFERENCES "Tweet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
