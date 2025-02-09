import { useState } from "react";
import { MoveLeft, Star } from "lucide-react";
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
    <div
      className={`flex items-center justify-center w-full min-h-screen transition-colors ${
        isDarkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div
        className={`max-w-lg w-full p-8 rounded-lg shadow-lg transition-colors ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        <MoveLeft
          className="cursor-pointer"
          onClick={() => navigate("/settings")}
        />

        <h2 className="text-2xl font-bold mb-6 text-center">
          We Value Your Feedback
        </h2>
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
                  className="focus:outline-none"
                >
                  <Star
                    fill={num <= (rating ?? 0) ? "#FFD700" : "none"}
                    stroke="currentColor"
                    className="w-8 h-8 cursor-pointer"
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
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
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
            className="w-full py-3 px-4 rounded-md text-white font-medium transition-colors bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
