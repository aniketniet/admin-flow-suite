import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import Modal from "react-modal";

// Make sure to bind modal to your appElement (http://reactcommunity.org/react-modal/accessibility/)
Modal.setAppElement("#root");

const AboutUsPage = () => {
  const [aboutData, setAboutData] = useState({
    title: "",
    description: "",
    image: null,
    previewImage: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [existingData, setExistingData] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const token = Cookies.get("admin_token");

  // Fetch existing about us data
  useEffect(() => {
    const fetchAboutUs = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_UR}admin/get-about-us`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.data) {
          setExistingData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching about us data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAboutUs();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAboutData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAboutData((prev) => ({
        ...prev,
        image: file,
        previewImage: URL.createObjectURL(file),
      }));
    }
  };

  const openEditModal = () => {
    if (existingData) {
      setAboutData({
        title: existingData.title || "",
        description: existingData.description || "",
        image: null,
        previewImage: existingData.image || "",
      });
    }
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("title", aboutData.title);
    formData.append("description", aboutData.description);
    if (aboutData.image) {
      formData.append("image", aboutData.image);
    }

    const token = Cookies.get("admin_token") || localStorage.getItem("token");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_UR}admin/add-about-us`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data && response.data.data) {
        setExistingData(response.data.data);
        toast.success(
          existingData
            ? "About Us updated successfully!"
            : "About Us created successfully!"
        );
      }
      closeModal();
    } catch (error) {
      console.error("Error submitting about us data:", error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred while saving About Us data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto md:max-w-6xl">
      <ToastContainer position="top-right" autoClose={5000} />
      <h1 className="text-2xl font-bold mb-6">About Us Management</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {isLoading && !existingData ? (
          <p>Loading...</p>
        ) : existingData ? (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">
                {existingData.title}
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {existingData.description}
              </p>
            </div>
            {existingData.image && (
              <div className="mb-4">
                <img
                  src={`${import.meta.env.VITE_BASE_URL_IMG}${
                    existingData.image
                  }`}
                  alt="About Us"
                  className="max-w-full h-auto max-h-60 rounded-md"
                />
              </div>
            )}
            <button
              onClick={openEditModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {existingData ? "Edit About Us" : "Add About Us"}
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-4">No About Us content found.</p>
            <button
              onClick={openEditModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create About Us
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Add About Us"
        className="bg-white rounded-lg shadow-xl p-6 w-full md:w-3/4 lg:w-2/3 mx-auto my-8 overflow-y-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        style={{
          content: {
            maxHeight: "90vh",
            margin: "auto",
            inset: "auto",
          },
        }}
      >
        <h2 className="text-2xl font-bold mb-6">
          {existingData ? "Edit About Us" : "Create About Us"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={aboutData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={aboutData.description}
              onChange={handleInputChange}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="image"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Image
            </label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {aboutData.previewImage && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Image Preview:
              </p>
              <img
                src={
                  aboutData.previewImage.startsWith("blob:")
                    ? aboutData.previewImage
                    : `${import.meta.env.VITE_BASE_URL_IMG}${
                        aboutData.previewImage
                      }`
                }
                alt="Preview"
                className="max-w-full h-auto max-h-40 rounded-md"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading
                ? "Saving..."
                : existingData
                ? "Update About Us"
                : "Save About Us"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AboutUsPage;