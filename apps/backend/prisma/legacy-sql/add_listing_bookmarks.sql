-- CreateTable
CREATE TABLE "listing_bookmarks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_bookmarks_user_id_idx" ON "listing_bookmarks"("user_id");

-- CreateIndex
CREATE INDEX "listing_bookmarks_listing_id_idx" ON "listing_bookmarks"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_bookmarks_user_id_listing_id_key" ON "listing_bookmarks"("user_id", "listing_id");

-- AddForeignKey
ALTER TABLE "listing_bookmarks" ADD CONSTRAINT "listing_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_bookmarks" ADD CONSTRAINT "listing_bookmarks_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
