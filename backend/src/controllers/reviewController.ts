import { Request, Response } from "express";
import Review from "../models/Review";
 
export const createReview = async (req: Request, res: Response) => {
  try {
    const newReview = await Review.create(req.body);
    res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ success: false, message: "Failed to create review." });
  }
};
 
export const updateReview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ReviewSubject, ReviewContent } = req.body;
 
  try {
    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
 
    review.ReviewSubject = ReviewSubject;
    review.ReviewContent = ReviewContent;
    await review.save();
 
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ success: false, message: "Failed to update review." });
  }
};
 
export const updateHelpful = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type } = req.body;
 
  try {
    const review = await Review.findByPk(id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
 
    if (type === "yes") {
      review.helpfulYes += 1;
    } else if (type === "no") {
      review.helpfulNo += 1;
    } else {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }
 
    await review.save();
    res.status(200).json({ success: true, data: review });
  } catch (err) {
    console.error("Error updating helpful count:", err);
    res.status(500).json({ success: false, message: "Failed to update helpful count" });
  }
};
 
const likedSet = new Set<string>();
const dislikedSet = new Set<string>();
 
export const likeReview = async (req: Request, res: Response) => {
  const { id } = req.params;
 
  try {
    const review = await Review.findByPk(id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
 
    const liked = likedSet.has(id);
    const disliked = dislikedSet.has(id);
 
    if (liked) {
      review.helpfulYes = Math.max((review.helpfulYes || 1) - 1, 0);
      likedSet.delete(id);
    } else {
      review.helpfulYes = (review.helpfulYes || 0) + 1;
      likedSet.add(id);
 
      if (disliked) {
        review.helpfulNo = Math.max((review.helpfulNo || 1) - 1, 0);
        dislikedSet.delete(id);
      }
    }
 
    await review.save();
    res.json({ success: true, data: review });
  } catch (err) {
    console.error("likeReview error", err);
    res.status(500).json({ success: false, message: "Failed to toggle like." });
  }
};
 
export const dislikeReview = async (req: Request, res: Response) => {
  const { id } = req.params;
 
  try {
    const review = await Review.findByPk(id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
 
    const disliked = dislikedSet.has(id);
    const liked = likedSet.has(id);
 
    if (disliked) {
      review.helpfulNo = Math.max((review.helpfulNo || 1) - 1, 0);
      dislikedSet.delete(id);
    } else {
      review.helpfulNo = (review.helpfulNo || 0) + 1;
      dislikedSet.add(id);
 
      if (liked) {
        review.helpfulYes = Math.max((review.helpfulYes || 1) - 1, 0);
        likedSet.delete(id);
      }
    }
 
    await review.save();
    res.json({ success: true, data: review });
  } catch (err) {
    console.error("dislikeReview error", err);
    res.status(500).json({ success: false, message: "Failed to toggle dislike." });
  }
};