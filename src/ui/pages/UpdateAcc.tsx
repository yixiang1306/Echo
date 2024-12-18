import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import DeleteAccModal from "./DeleteAccModal";
import UpdateAccModal from "./UpdateAccModal";

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
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);

  // Fetch user data
  const fetchName = async () => {
    if (!currentSession) return;
    const { data: User, error } = await supabase
      .from("User")
      .select("firstName, lastName")
      .eq("accountId", currentSession.data.session.user.id)
      .single();

    if (error) {
      setFetchData(null);
      console.error("Error fetching user data:", error.message);
    } else {
      setFetchData(User);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      const currentSession = await supabase.auth.getSession();
      setCurrentSession(currentSession);
    };
    fetchSession();
  }, []);

  useEffect(() => {
    fetchName();
  }, [currentSession]);

  useEffect(() => {
    if (fetchData) {
      setFirstName(fetchData.firstName);
      setLastName(fetchData.lastName);
    }
  }, [fetchData]);

  // Handle password update
  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setFeedbackMessage("Passwords do not match.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error("Error updating password:", error.message);
      setFeedbackMessage("Error updating password.");
    } else {
      setFeedbackMessage("Password updated successfully!");
    }
  };

  // Handle name change
  const handleNameChange = async () => {
    if (!firstName || !lastName) {
      setFeedbackMessage("Please fill in both first and last name.");
      return;
    }

    const { error } = await supabase
      .from("User")
      .update({ firstName, lastName })
      .eq("accountId", currentSession.data.session.user.id);

    if (error) {
      console.error("Error updating name:", error.message);
      setFeedbackMessage("Error updating name.");
    } else {
      setFeedbackMessage("Name updated successfully!");
    }
  };

  const handleCleanupSession = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("accountId"); // Remove from localStorage
  };

  const handleDeleteAccount = async () => {
    try {
      if (!currentSession) {
        setFeedbackMessage("No session found.");
        return;
      }

      // Delete the user data from your database first
      const { error: deleteError } = await supabase
        .from("User")
        .delete()
        .eq("accountId", currentSession.data.session.user.id);

      if (deleteError) {
        console.error("Error deleting user data:", deleteError.message);
        setFeedbackMessage("Error deleting account .");
        return;
      }

      const { error: authError } = await supabase.rpc("deleteUser");

      if (authError) {
        console.error(
          "Error deleting user from authentication:",
          authError.message
        );
        setFeedbackMessage("Error deleting account from auth.");
      } else {
        setFeedbackMessage("Account deleted successfully!");
        await handleCleanupSession();
        navigate("/");
      }
    } catch (error) {
      console.error("Error during account deletion:", error);
      setFeedbackMessage("Error deleting account.");
    }
  };

  // Handle modal visibility
  const handlePasswordUpdate = () => setShowUpdatePasswordModal(true);
  const handleProfileUpdate = () => setShowUpdateProfileModal(true);
  const handleDelete = () => setShowDeleteModal(true);

  const confirmPasswordUpdate = async () => {
    await handleUpdatePassword();

    setShowUpdatePasswordModal(false);
  };
  const confirmProfileUpdate = async () => {
    await handleNameChange();
    setShowUpdateProfileModal(false);
  };

  const confirmDelete = async () => {
    await handleDeleteAccount();
    setShowDeleteModal(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 py-6">
      {/* Header */}
      <div className="absolute top-5 left-10 cursor-pointer text-3xl font-bold">
        <span className="text-black">Ask</span>
        <span className="text-indigo-500">Vox</span>
      </div>

      <div
        className="absolute top-5 right-10 cursor-pointer text-2xl"
        onClick={() => navigate("/settings")}
      >
        &times;
      </div>

      <h1 className="text-2xl font-semibold mb-6">Profile Settings</h1>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4 w-full max-w-md">
          {feedbackMessage}
          <button
            onClick={() => setFeedbackMessage("")}
            className="ml-4 text-green-500 hover:text-green-700"
          >
            &times;
          </button>
        </div>
      )}

      {/* Form */}
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md space-y-6">
        {/* Edit Profile Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Edit Profile</h2>

          <div className="flex flex-col">
            <input
              id="firstName"
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col">
            <input
              id="lastName"
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Update Name Button */}
          <div className="flex justify-start">
            <button
              onClick={handleProfileUpdate}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Update Name
            </button>
          </div>
        </div>

        {/* Edit Password Section */}
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-gray-700">Edit Password</h2>

          <div className="flex flex-col">
            <input
              id="newPassword"
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col">
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Update Password Button */}
          <div className="flex justify-start">
            <button
              onClick={handlePasswordUpdate}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Update Password
            </button>
          </div>
        </div>

        {/* Manage Account Section */}
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-gray-700">
            Manage Account
          </h2>

          <div className="flex justify-start">
            <button
              onClick={handleDelete}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showUpdatePasswordModal && (
        <UpdateAccModal
          title="Password"
          onConfirm={confirmPasswordUpdate}
          onCancel={() => setShowUpdatePasswordModal(false)}
        />
      )}

      {showUpdateProfileModal && (
        <UpdateAccModal
          title="Profile"
          onConfirm={confirmProfileUpdate}
          onCancel={() => setShowUpdateProfileModal(false)}
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
