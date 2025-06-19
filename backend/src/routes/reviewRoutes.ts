import express from "express";
import { createReview, updateReview , updateHelpful, likeReview, dislikeReview} from "../controllers/reviewController";
 
const router = express.Router();
 
router.post("/reviews", createReview);
router.put("/reviews/:id", updateReview);
router.put("/reviews/:id/helpful", updateHelpful);
router.post("/reviews/:id/like", likeReview);
router.post("/reviews/:id/dislike", dislikeReview);
 
export default router;