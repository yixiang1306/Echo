import { useState } from "react";
import { MoveLeft, Star, X } from "lucide-react";
import { supabase } from "../utility/supabaseClient";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../utility/authprovider";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

enum FEEDBACK_CATEGORY {
  UI = "UI",
  AI = "AI",
  PERFORMANCE = "PERFORMANCE",
  Other = "Other",
}

enum FEEDBACK_RATING {
  ONE_STAR = "ONE_STAR",
  TWO_STAR = "TWO_STAR",
  THREE_STAR = "THREE_STAR",
  FOUR_STAR = "FOUR_STAR",
  FIVE_STAR = "FIVE_STAR",
}

const ratingOptions = Object.values(FEEDBACK_RATING);
const categoryOptions = Object.values(FEEDBACK_CATEGORY);

const Feedback = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { session } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState<FEEDBACK_CATEGORY | "">("");

  const handleSubmitFeedback = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    // Ensure rating, category, and session exist before submission
    if (rating === null || !category || !session) return;

    const { error } = await supabase.from("Feedback").insert([
      {
        id: uuidv4(),
        accountId: session.user.id,
        rating: ratingOptions[rating - 1], // Convert number (1-5) to enum value
        comment: comment,
        category: category,
        createdAt: new Date().toISOString(), // Fixed: call as a function
      },
    ]);

    if (error) {
      alert("Error Submitting Feedback");
      console.error("Error Feedback submission " + error.message);
    } else {
      alert("Successfully Submitted");
      console.log("Feedback submitted successfully!");
      setRating(null);
      setComment("");
      setCategory("");
    }
  };
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-gray-100 dark:bg-primary text-gray-900 dark:text-white flex items-center justify-center transition-all duration-300">
      {/* Logo */}
      <div
        className="absolute top-5 left-10 text-2xl font-bold cursor-pointer drop-shadow-[0_0_10px_rgba(0,150,255,0.8)]"
        onClick={() => navigate("/app")}
      >
        <h1 className="dark:text-white text-gray-900 text-3xl">ECHO</h1>
      </div>

      {/* Close Button */}
      <div
        className="absolute top-5 right-5 text-3xl cursor-pointer text-gray-900 dark:text-gray-300 hover:text-red-500 transition duration-300"
        onClick={() => navigate("/app")}
      >
        <X className="size-10" />
      </div>
      <div className="relative flex flex-col items-center max-w-lg w-full p-8 space-y-4  bg-white dark:bg-secondary  rounded-3xl shadow-xl backdrop-blur-md border border-gray-300 dark:border-gray-700 transition-all duration-300">
        {/* Glowing Border Effect */}
        <div className="absolute inset-0 border-[2px] border-blue-500/40 rounded-3xl blur-sm pointer-events-none shadow-[0_0_20px_rgba(0,150,255,0.4)]"></div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking text-gray-900 dark:text-white drop-shadow-[0_0_15px_rgba(0,150,255,0.8)]">
          Feedback
        </h1>

        <form className="space-y-6" onSubmit={handleSubmitFeedback}>
          {/* Rating Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex justify-center space-x-3">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setRating(num)}
                  className="test-start-btn focus:outline-none"
                >
                  <Star
                    fill={num <= (rating ?? 0) ? "#FFD700" : "none"}
                    stroke="currentColor"
                    className="test-star w-8 h-8 cursor-pointer"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 focus:ring-blue-400"
                  : "bg-gray-50 border-gray-300 focus:ring-blue-500"
              }`}
              value={category}
              onChange={(e) => setCategory(e.target.value as FEEDBACK_CATEGORY)}
              required
            >
              <option value="" disabled>
                Select Category
              </option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Comment Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Comment</label>
            <textarea
              className={`test-textarea w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 focus:ring-blue-400"
                  : "bg-gray-50 border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Write your review here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="test-submit-btn w-full py-3 px-4 rounded-md text-white font-medium transition-colors bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
