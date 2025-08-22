import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useParams } from "react-router-dom";
import {toast} from "sonner";


const VendorProfile = () => {
  const { vendorId } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const token = Cookies.get("admin_token");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_UR}admin/get-vendor/${vendorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUserData(response.data.vendor);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to fetch vendor data");
        toast.error(err.message || "Failed to fetch vendor data");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [vendorId, token]);
  const updateVendorStatus = async () => {
    if (!userData) return;

    setUpdatingStatus(true);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_UR}admin/active-inactive-vendor/${vendorId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUserData(response.data.vendor);
      toast.success("Vendor status updated successfully");
    } catch (err: any) {
      setError(err.message || "Failed to update vendor status");
      toast.error(err.message || "Failed to update vendor status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (error) {
    return (
      <div className="flex h-screen">
        {/* <Sidebar
          activeSection="userProfile"
          onSectionChange={(section) => console.log(section)}
        /> */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {/* <Header title="User Profile" /> */}
          <div className="p-6">
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex h-screen">
        {/* <Sidebar
          activeSection="userProfile"
          onSectionChange={(section) => console.log(section)}
        /> */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {/* <Header title="User Profile" /> */}
          <div className="p-6">
            <div
              className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Warning: </strong>
              <span className="block sm:inline">No user data found</span>
            </div>
         
          </div>
        </div>
      </div>
    );
  }

  // Get default address if exists
  // Get default pickup address if exists
  const defaultAddress =
    userData.pickupAddresses && userData.pickupAddresses.length > 0
      ? userData.pickupAddresses[0]
      : null;

  return (
    <>
   
    <div className="flex h-screen">
      {/* <Sidebar
        activeSection="userProfile"
        onSectionChange={(section) => console.log(section)}
      /> */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        {/* <Header title="User Profile" /> */}
        <div className="p-6">
          <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-xl p-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div className="flex items-center mb-4 md:mb-0">
                {/* <div className="relative">
                  <img
                    src={"https://via.placeholder.com/150"}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center ${
                        userData.status === "ACTIVE"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      <span className="text-white text-xs font-bold">
                        {userData.status === "ACTIVE" ? "A" : "I"}
                      </span>
                    </div>
                  </div>
                </div> */}
                <div className="ml-6">
                  <h1 className="text-2xl font-bold text-gray-800">
                    {userData.name}
                  </h1>
                  <p className="text-gray-600">{userData.email}</p>
                  <div className="flex items-center mt-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        userData.role === "ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {userData.role}
                    </span>
                    <span
                      className={`inline-block ml-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        userData.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {userData.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={updateVendorStatus}
                  disabled={updatingStatus}
                  className={`px-4 py-2 rounded-lg transition flex items-center ${
                    userData.status === "ACTIVE"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  } ${updatingStatus ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {updatingStatus ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {userData.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </>
                  )}
                </button>
                {/* <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
                  </svg>
                  View Activity
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Profile
                </button> */}
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">
                      User Role
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {userData.role}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      Member Since
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {new Date(userData.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                        }
                      )}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">
                      Last Updated
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {new Date(userData.updatedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-lg ${
                  userData.status === "ACTIVE" ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        userData.status === "ACTIVE"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      Account Status
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {userData.status}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-full ${
                      userData.status === "ACTIVE"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-6 w-6 ${
                        userData.status === "ACTIVE"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {userData.status === "ACTIVE" ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728"
                        />
                      )}
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Personal Information
                </h2>
                <div className="space-y-4">
                  <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-800">{userData.name}</p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-medium text-gray-800">
                    {userData.email}
                  </p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="font-medium text-gray-800">
                    {userData.phone || <span className="italic text-gray-400">N/A</span>}
                  </p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">User Role</p>
                  <p className="font-medium text-gray-800">{userData.role}</p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">Account Status</p>
                  <p className="font-medium text-gray-800">
                    <span
                    className={`px-2 py-1 rounded text-xs ${
                      userData.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                    }`}
                    >
                    {userData.status}
                    </span>
                  </p>
                  </div>
                
                  <div>
                  <p className="text-sm text-gray-500">GST Number</p>
                  <p className="font-medium text-gray-800">
                    {userData.gst_no || <span className="italic text-gray-400">N/A</span>}
                  </p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">EID Number</p>
                  <p className="font-medium text-gray-800">
                    {userData.eid_no || <span className="italic text-gray-400">N/A</span>}
                  </p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">Bank Name</p>
                  <p className="font-medium text-gray-800">
                    {userData.bank_name || <span className="italic text-gray-400">N/A</span>}
                  </p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">Bank Account No</p>
                  <p className="font-medium text-gray-800">
                    {userData.bank_account_no || <span className="italic text-gray-400">N/A</span>}
                  </p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">Bank IFSC</p>
                  <p className="font-medium text-gray-800">
                    {userData.bank_ifsc || <span className="italic text-gray-400">N/A</span>}
                  </p>
                  </div>
                    <div>
                  <p className="text-sm text-gray-500">Account Created</p>
                  <p className="font-medium text-gray-800">
                    {new Date(userData.createdAt).toLocaleString()}
                  </p>
                  </div>

                </div>
                </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Address Information
                </h2>
                {defaultAddress ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Street Address</p>
                      <p className="font-medium text-gray-800">
                        {defaultAddress.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Country</p>
                      <p className="font-medium text-gray-800">
                        {defaultAddress.country}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">State</p>
                      <p className="font-medium text-gray-800">
                        {defaultAddress.state}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">City</p>
                      <p className="font-medium text-gray-800">
                        {defaultAddress.city}
                      </p>
                    </div>
                  
                    <div>
                      <p className="text-sm text-gray-500">Pincode</p>
                      <p className="font-medium text-gray-800">
                        {defaultAddress.pin_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">PickUp Location</p>
                      <p className="font-medium text-gray-800">
                        {defaultAddress.pickup_location
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    No address information available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default VendorProfile;
