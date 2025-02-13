import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utility/supabaseClient";
import DeleteAccModal from "./DeleteAccModal";
import UpdateAccModal from "./UpdateAccModal";
import { useTheme } from "../context/ThemeContext";
import { X } from "lucide-react";
import { useLoading } from "../utility/loadingContext";

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
  const { setLoading } = useLoading();
  // Use the theme context
  const { isDarkMode } = useTheme();

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
    try {
      setLoading(true);
      fetchName();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
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
      .eq("accountId", currentSession?.data?.session?.user?.id);
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
      const { error: authError } = await supabase.rpc("delete_user_and_data", {
        user_id: currentSession.data.session.user.id,
      });
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
      <div>
        {/* Feedback Message */}
        {feedbackMessage && (
          <div
            className={`test-response-message ${
              isDarkMode
                ? "bg-gray-800 text-gray-200"
                : "bg-green-100 text-green-700"
            } px-4 py-3 rounded-lg mb-4 w-full max-w-md`}
          >
            {feedbackMessage}
            <button
              onClick={() => setFeedbackMessage("")}
              className={`ml-4 ${
                isDarkMode ? "text-gray-400" : "text-green-500"
              } hover:${isDarkMode ? "text-gray-200" : "text-green-700"}`}
            >
              &times;
            </button>
          </div>
        )}

        {/* Form */}
        <div className="relative flex flex-col space-y-6 items-center bg-white dark:bg-secondary p-12 rounded-3xl shadow-xl backdrop-blur-md border border-gray-300 dark:border-gray-700 transition-all duration-300">
          {/* Glowing Border Effect */}
          <div className="absolute inset-0 border-[2px] border-blue-500/40 rounded-3xl blur-sm pointer-events-none shadow-[0_0_20px_rgba(0,150,255,0.4)]"></div>

          {/* Title */}
          <h1 className="text-3xl font-extrabold tracking text-gray-900 dark:text-white drop-shadow-[0_0_15px_rgba(0,150,255,0.8)]">
            Settings
          </h1>
          {/* Edit Profile Section */}
          <div className="space-y-4 w-72">
            <h2 className="text-xl font-semibold">Edit Profile</h2>
            <div className="flex flex-col">
              <input
                id="firstName"
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full p-3 border ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700"
                    : "border-gray-300 bg-white"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>
            <div className="flex flex-col">
              <input
                id="lastName"
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full p-3 border ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700"
                    : "border-gray-300 bg-white"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
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
          <div className="space-y-4 mt-8 w-72">
            <h2 className="text-xl font-semibold">Edit Password</h2>
            <div className="flex flex-col">
              <input
                id="newPassword"
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full p-3 border ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700"
                    : "border-gray-300 bg-white"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>
            <div className="flex flex-col">
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full p-3 border ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700"
                    : "border-gray-300 bg-white"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
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
          <div className="space-y-4 mt-8 w-72 ">
            <h2 className="text-xl font-semibold">Manage Account</h2>
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

// import { useNavigate } from "react-router-dom";
// import { useTheme } from "../context/ThemeContext";
// import { X } from "lucide-react";

// interface SettingsProps {
//   clearChatHistory: () => void;
// }

// const Settings: React.FC<SettingsProps> = ({ clearChatHistory }) => {
//   const navigate = useNavigate();
//   const { isDarkMode, toggleTheme } = useTheme();

//   return (
//     <div className="fixed top-0 left-0 w-full h-full bg-gray-100 dark:bg-primary text-gray-900 dark:text-white flex items-center justify-center transition-all duration-300">
//       {/* Logo */}
//       <div
//         className="absolute top-5 left-10 text-2xl font-bold cursor-pointer drop-shadow-[0_0_10px_rgba(0,150,255,0.8)]"
//         onClick={() => navigate("/app")}
//       >
//         <h1 className="dark:text-white text-gray-900 text-3xl">ECHO</h1>
//       </div>

//       {/* Close Button */}
//       <div
//         className="absolute top-5 right-5 text-3xl cursor-pointer text-gray-900 dark:text-gray-300 hover:text-red-500 transition duration-300"
//         onClick={() => navigate("/app")}
//       >
//         <X className="size-10" />
//       </div>

//       {/* Main Container */}
//       <div className="relative flex flex-col items-center text-center bg-white dark:bg-secondary p-12 rounded-3xl shadow-xl backdrop-blur-md border border-gray-300 dark:border-gray-700 transition-all duration-300">
//         {/* Glowing Border Effect */}
//         <div className="absolute inset-0 border-[2px] border-blue-500/40 rounded-3xl blur-sm pointer-events-none shadow-[0_0_20px_rgba(0,150,255,0.4)]"></div>

//         {/* Title */}
//         <h1 className="text-3xl font-extrabold tracking text-gray-900 dark:text-white drop-shadow-[0_0_15px_rgba(0,150,255,0.8)]">
//           Settings
//         </h1>

//         {/* Options */}
//         <div className="mt-8 flex flex-col items-center w-full space-y-5">
//           <button
//             className="w-64 px-6 py-3 rounded-lg text-lg font-semibold border border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-300 bg-gray-200 dark:bg-transparent
//             hover:bg-gray-300 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition duration-300 shadow-lg shadow-blue-500/30"
//             onClick={() => navigate("/updateAcc")}
//           >
//             Profile Settings
//           </button>
//           <button
//             className="w-64 px-6 py-3 rounded-lg text-lg font-semibold border border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-300 bg-gray-200 dark:bg-transparent
//             hover:bg-gray-300 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition duration-300 shadow-lg shadow-purple-500/30"
//             onClick={() => navigate("/feedback")}
//           >
//             Feedback
//           </button>
//           <button
//             className="w-64 px-6 py-3 rounded-lg text-lg font-semibold border border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-300 bg-gray-200 dark:bg-transparent
//             hover:bg-gray-300 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition duration-300 shadow-lg shadow-red-500/30"
//             onClick={clearChatHistory}
//           >
//             Clear Chat History
//           </button>

//           {/* Dark Mode Toggle */}
//           <button
//             onClick={toggleTheme}
//             className="w-64 px-6 py-3 rounded-lg text-lg font-semibold border border-indigo-400 dark:border-indigo-500 text-gray-900 dark:text-gray-300 bg-gray-200 dark:bg-transparent
//             hover:bg-gray-300 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition duration-300 shadow-lg shadow-indigo-500/30"
//           >
//             {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Settings;
