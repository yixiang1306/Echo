import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import DeleteAccModal from "./DeleteAccModal";
import UpdateAccModal from "./UpdateAccModal";
import { supabase } from "../supabaseClient";

interface FetchDataType {
  firstName: string;
  lastName: string;
}

function UpdateAcc() {
  const navigate = useNavigate();
  const [fetchData, setFetchData] = useState<FetchDataType | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Fetch user name
  const fetchName = async (session: any) => {
    if (session) {
      let { data: User, error } = await supabase
        .from("User")
        .select("firstName,lastName")
        .eq("accountId", session.data.user.id)
        .single(); // Use .single() to return just one user instead of an array
      if (error) {
        setFetchData(null);
        console.error("Error fetching user data:", error.message);
      } else {
        setFetchData(User);
      }
    }
  };

  useEffect(() => {
    const session = supabase.auth.getSession();
    fetchName(session);
  }, []);

  useEffect(() => {
    if (fetchData) {
      setFirstName(fetchData.firstName); // Safely access firstName
      setLastName(fetchData.lastName); // Safely access lastName
    }
  }, [fetchData]);

  const handleUpdate = () => {
    setShowUpdateModal(true);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmUpdate = () => {
    setShowUpdateModal(false);
    setFeedbackMessage("Profile updated successfully!");
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    setFeedbackMessage("Account deleted!");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      {/* Logo */}
      <div
        className="absolute top-5 left-10 cursor-pointer text-4xl font-bold"
        onClick={() => navigate("/app")}
      >
        <span className="text-black">Ask</span>
        <span className="text-indigo-500">Vox</span>
      </div>

      {/* Close Button */}
      <div
        className="absolute top-5 right-10 cursor-pointer text-4xl"
        onClick={() => navigate("/settings")}
      >
        &times;
      </div>

      {/* Header */}
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      {feedbackMessage && (
        <p className="text-green-600 font-semibold mb-4">{feedbackMessage}</p>
      )}

      {/* Form Container */}
      <div className="w-full max-w-md space-y-4">
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full p-3 bg-gray-100 rounded-lg outline-none"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full p-3 bg-gray-100 rounded-lg outline-none"
        />

        {/* New Password Input */}
        <div className="relative">
          <input
            type={showNewPassword ? "text" : "password"}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-3 bg-gray-100 rounded-lg outline-none"
          />
          <span
            className="absolute top-1/2 right-4 transform -translate-y-1/2 cursor-pointer"
            onClick={() => setShowNewPassword((prev) => !prev)}
          >
            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        {/* Re-type New Password Input */}
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Re-type New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 bg-gray-100 rounded-lg outline-none"
          />
          <span
            className="absolute top-1/2 right-4 transform -translate-y-1/2 cursor-pointer"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-8 mt-4">
          <button
            onClick={handleUpdate}
            className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
          >
            Update
          </button>
          <button
            onClick={handleDelete}
            className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Modals */}
      {showUpdateModal && (
        <UpdateAccModal
          onConfirm={confirmUpdate}
          onCancel={() => setShowUpdateModal(false)}
        />
      )}
      {showDeleteModal && (
        <DeleteAccModal
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

export default UpdateAcc;
