"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Review, fetchReviewsForBook } from "@/lib/books-store";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { doc, setDoc, updateDoc, increment } from "firebase/firestore";
import { Star, MessageSquare } from "lucide-react";
import { nanoid } from "nanoid";

interface ReviewsSectionProps {
  bookId: string;
}

export function ReviewsSection({ bookId }: ReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      setLoading(true);
      const fetchedReviews = await fetchReviewsForBook(bookId);
      setReviews(fetchedReviews);
      
      if (user) {
        const userReview = fetchedReviews.find(r => r.userId === user.uid);
        if (userReview) {
          setHasReviewed(true);
        }
      }
      setLoading(false);
    }
    loadReviews();
  }, [bookId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (comment.trim().length === 0) {
      setError("Please write a comment.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const reviewId = nanoid(10);
    const newReview: Omit<Review, "id"> = {
      bookId,
      userId: user.uid,
      userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "reviews", reviewId), newReview);
      
      // Update book stats
      // This part could fail if rules don't perfectly allow increment via client, but we allowed rating/reviewCount in rules.
      // Wait, we need to read the current book stats or use increment.
      // Increment is best done if we use updateDoc with increment.
      
      // Calculate new average:
      const totalReviews = reviews.length;
      const currentAvg = reviews.reduce((acc, r) => acc + r.rating, 0) / (totalReviews || 1);
      const newTotalReviews = totalReviews + 1;
      const newAvg = ((currentAvg * totalReviews) + rating) / newTotalReviews;

      await updateDoc(doc(db, "books", bookId), {
        averageRating: newAvg,
        reviewCount: newTotalReviews
      });

      setReviews([{ id: reviewId, ...newReview }, ...reviews]);
      setHasReviewed(true);
      setComment("");
      setRating(5);
    } catch (err: any) {
      console.error(err);
      setError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-2 space-y-3">
      <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5 text-[#2053BA]" /> Ratings & Reviews
      </h2>

      {/* Review Form */}
      {user ? (
        hasReviewed ? (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
            <p className="text-xs font-medium text-gray-700">You have already reviewed this book. Thank you!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Your Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-5 h-5 ${star <= rating ? "text-[#BA8720] fill-[#BA8720]" : "text-gray-300 fill-gray-300"} transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Your Review</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your review here..."
                rows={3}
                className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#2053BA] focus:border-[#2053BA] outline-none transition-shadow resize-none"
                disabled={isSubmitting}
              />
            </div>

            {error && <p className="text-[10px] font-semibold text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#2053BA] hover:bg-[#2053BA]/90 text-white font-bold text-xs py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
          <p className="text-xs font-medium text-gray-700 mb-2">Sign in to leave a review.</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3 pt-2">
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#2053BA] animate-spin"></div>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-900">{review.userName}</span>
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-[#BA8720] fill-[#BA8720]" />
                  <span className="text-[10px] font-bold text-gray-700">{review.rating.toFixed(1)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{review.comment}</p>
              <span className="text-[9px] text-gray-400 mt-1 block">
                {new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500 text-center py-4">No reviews yet. Be the first to review!</p>
        )}
      </div>
    </section>
  );
}
