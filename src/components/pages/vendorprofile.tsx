import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";
import { useParams } from "react-router-dom";
import {toast} from "sonner";


const VendorProfile = () => {
  const { vendorId } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyingVendor, setVerifyingVendor] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const token = Cookies.get("admin_token");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!vendorId) {
        toast.error("Invalid vendor ID");
        setLoading(false);
        return;
      }
      
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
      } catch (err: unknown) {
        // Extract error message from axios error response if available
        let errorMessage = "Failed to fetch vendor data";
        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.message || err.message || errorMessage;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        // Show error in toast only
        toast.error(errorMessage);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [vendorId, token]);


  // Dedicated function for verifying vendors (using update status API)
  const verifyVendor = async () => {
    if (!userData) return;

    setVerifyingVendor(true);
    try {
      // Using URLSearchParams as required by the API
      const params = new URLSearchParams();
      params.append('id', userData.id.toString());
      
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_UR}admin/update-vendor-status`,
        params,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
        }
      );

      // Update the userData with the new verification status
      setUserData({
        ...userData,
        is_verified: true,
        ...response.data.vendor
      });
      toast.success("Vendor verified successfully");
    } catch (err: unknown) {
      // Extract error message from axios error response if available
      let errorMessage = "Failed to verify vendor";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
        // Handle specific case where vendor is already verified
        if (err.response?.status === 400 && err.response?.data?.message?.includes("already")) {
          errorMessage = "Vendor is already verified";
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Show error in toast only
      toast.error(errorMessage);
    } finally {
      setVerifyingVendor(false);
    }
  };

  const updateVendorStatus = async () => {
    if (!userData) return;

    setTogglingStatus(true);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_UR}admin/active-inactive-vendor/${userData.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
        }
      );

      // Update the userData with the new status
      setUserData({
        ...userData,
        status: response.data.vendor.status,
        ...response.data.vendor
      });
      toast.success("Vendor status updated successfully");
    } catch (err: unknown) {
      // Extract error message from axios error response if available
      let errorMessage = "Failed to update vendor status";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
        // Handle specific case where operation is not allowed
        if (err.response?.status === 400 && err.response?.data?.message?.includes("already")) {
          errorMessage = "Vendor status is already set to this value";
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Show error in toast only
      toast.error(errorMessage);
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="p-6">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-xl p-6">
              <div className="text-center py-12">
                <div className="text-gray-500 text-xl font-semibold mb-4">Loading Vendor Data...</div>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData && !loading) {
    toast.error("No vendor data found");
    // Redirect to vendor list or show a more user-friendly message
    return (
      <div className="flex h-screen">
        {/* <Sidebar
          activeSection="userProfile"
          onSectionChange={(section) => console.log(section)}
        /> */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {/* <Header title="User Profile" /> */}
          <div className="p-6">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-xl p-6">
              <div className="text-center py-12">
                <div className="text-gray-500 text-xl font-semibold mb-4">No Vendor Data Found</div>
                <p className="text-gray-600 mb-6">The requested vendor information could not be found.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get default address if exists
  // Get default pickup address if exists
  const defaultAddress =
    userData?.pickupAddresses && userData?.pickupAddresses.length > 0
      ? userData?.pickupAddresses[0]
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
                    {userData?.name || "Unknown Vendor"}
                  </h1>
                  <p className="text-gray-600">{userData?.email || "No email provided"}</p>
                  <div className="flex items-center mt-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        userData?.role === "ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {userData?.role || "VENDOR"}
                    </span>
                    <span
                      className={`inline-block ml-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        userData?.status && userData.status.toUpperCase() === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {userData?.status || "UNKNOWN"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                {/* Show Verified badge when vendor is verified, otherwise show Verify button */}
                {userData?.is_verified ? (
                  <span className="inline-flex items-center px-4 py-2 rounded-lg bg-green-100 text-green-800 font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <button
                    onClick={verifyVendor}
                    disabled={verifyingVendor || !userData}
                    className={`px-4 py-2 rounded-lg transition flex items-center bg-blue-600 hover:bg-blue-700 text-white ${verifyingVendor ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {verifyingVendor ? (
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
                        Verifying...
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
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verify
                      </>
                    )}
                  </button>
                )}
                
                {/* Active/Inactive toggle button - always visible */}
                <button
                  onClick={updateVendorStatus}
                  disabled={togglingStatus || !userData}
                  className={`px-4 py-2 rounded-lg transition flex items-center ${
                    userData?.status && userData.status.toUpperCase() === "ACTIVE"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  } ${togglingStatus ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {togglingStatus ? (
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
                      {userData?.status && userData.status.toUpperCase() === "ACTIVE" ? "Deactivate" : "Activate"}
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
                    <path d="M8 9a3 3 0 110-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
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
                      {userData?.role || "Unknown"}
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
                      {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                        }
                      ) : "Unknown"}
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
                      {userData?.updatedAt ? new Date(userData.updatedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      ) : "Unknown"}
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
                  userData?.status && userData.status.toUpperCase() === "ACTIVE" ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        userData?.status && userData.status.toUpperCase() === "ACTIVE"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      Account Status
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {userData?.status || "Unknown"}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-full ${
                      userData?.status && userData.status.toUpperCase() === "ACTIVE"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-6 w-6 ${
                        userData?.status && userData.status.toUpperCase() === "ACTIVE"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {userData?.status && userData.status.toUpperCase() === "ACTIVE" ? (
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
                  <p className="font-medium text-gray-800">{userData?.name || "N/A"}</p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-medium text-gray-800">
                    {userData?.email || "N/A"}
                  </p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="font-medium text-gray-800">
                    {userData?.phone || <span className="italic text-gray-400">N/A</span>}
                  </p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">User Role</p>
                  <p className="font-medium text-gray-800">{userData?.role || "N/A"}</p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">Account Status</p>
                  <p className="font-medium text-gray-800">
                    <span
                    className={`px-2 py-1 rounded text-xs ${
                      userData?.status && userData.status.toUpperCase() === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                    }`}
                    >
                    {userData?.status || "N/A"}
                    </span>
                  </p>
                  </div>
                
                  <div>
                  <p className="text-sm text-gray-500">GST Number</p>
                  <p className="font-medium text-gray-800">
                    {userData?.gst_no || <span className="italic text-gray-400">N/A</span>}
                  </p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">EID Number</p>
                  <p className="font-medium text-gray-800">
                    {userData?.eid_no || <span className="italic text-gray-400">N/A</span>}
                  </p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">Bank Name</p>
                  <p className="font-medium text-gray-800">
                    {userData?.bank_name || <span className="italic text-gray-400">N/A</span>}
                  </p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">Bank Account No</p>
                  <p className="font-medium text-gray-800">
                    {userData?.bank_account_no || <span className="italic text-gray-400">N/A</span>}
                  </p>
                  </div>
                  <div>
                  <p className="text-sm text-gray-500">Bank IFSC</p>
                  <p className="font-medium text-gray-800">
                    {userData?.bank_ifsc || <span className="italic text-gray-400">N/A</span>}
                  </p>
                  </div>
                    <div>
                  <p className="text-sm text-gray-500">Account Created</p>
                  <p className="font-medium text-gray-800">
                    {userData?.createdAt ? new Date(userData.createdAt).toLocaleString() : "N/A"}
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
                        {defaultAddress.address || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Country</p>
                      <p className="font-medium text-gray-800">
                        {defaultAddress.country || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">State</p>
                      <p className="font-medium text-gray-800">
                        {defaultAddress.state || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">City</p>
                      <p className="font-medium text-gray-800">
                        {defaultAddress.city || "N/A"}
                      </p>
                    </div>
                  
                    <div>
                      <p className="text-sm text-gray-500">Pincode</p>
                      <p className="font-medium text-gray-800">
                        {defaultAddress.pin_code || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">PickUp Location</p>
                      <p className="font-medium text-gray-800">
                        {defaultAddress.pickup_location || "N/A"}
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
