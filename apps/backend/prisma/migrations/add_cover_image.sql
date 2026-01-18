-- Add is_cover column to listing_images table
ALTER TABLE listing_images ADD COLUMN is_cover BOOLEAN NOT NULL DEFAULT false;

-- Set first image (by order_index) as cover for each listing that has images
WITH first_images AS (
  SELECT DISTINCT ON (listing_id) id
  FROM listing_images
  ORDER BY listing_id, order_index ASC
)
UPDATE listing_images
SET is_cover = true
WHERE id IN (SELECT id FROM first_images);
