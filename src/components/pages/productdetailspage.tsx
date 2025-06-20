import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Cookies from "js-cookie";
import { Header } from "../layout/Header";
import { Sidebar } from "../layout/Sidebar";

const ProductdetailsPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const token = Cookies.get("admin_token");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(
          `http://103.189.173.127:3000/api/admin/get-product/${productId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch product");
        }

        const data = await response.json();
        setProduct(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, token]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        Error: {error}
      </div>
    );
  if (!product)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        Product not found
      </div>
    );

  const variant = product.variants[0];
  const price = parseFloat(variant.price);

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      {/* <Header title="Product Details" /> */}

      <div className="flex">
        {/* Sidebar */}
        {/* <Sidebar
          activeSection="products"
          onSectionChange={(section) =>
            console.log(`Section changed to: ${section}`)
          }
        /> */}

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-6 py-12">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Product Details</h1>
            {/* <button
              onClick={() =>
                (window.location.href = `/edit-product/${productId}`)
              }
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
            >
              Edit
            </button> */}
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Product Images */}
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <div className="bg-gray-50 p-8 flex items-center justify-center h-96 mb-4">
                <img
                  src={`http://103.189.173.127:3000${variant.images[selectedImage]}`}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {variant.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`h-24 bg-gray-50 flex items-center justify-center p-2 ${
                      selectedImage === index ? "ring-2 ring-black" : ""
                    }`}
                  >
                    <img
                      src={`http://103.189.173.127:3000${image}`}
                      alt={`${product.name} thumbnail ${index}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:w-1/2 lg:pl-16">
              <div className="mb-6">
                <span className="text-sm text-gray-500 uppercase tracking-wider">
                  {product.mainCategory.name}
                </span>
                <h1 className="text-3xl font-serif font-light mt-2 mb-4">
                  {product.name}
                </h1>
                <div className="flex items-center mb-6">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-500 text-sm ml-2">
                    (24 reviews)
                  </span>
                </div>
              </div>

              <div className="mb-8">
                <span className="text-2xl font-serif">₹{price.toFixed(2)}</span>
                <div className="mt-2 text-sm text-gray-500">
                  Inclusive of all taxes
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-medium mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-medium mb-4">Key Benefits</h2>
                <ul className="list-disc pl-5 text-gray-700 space-y-2">
                  <li>Reduces dark spots and evens out skin tone</li>
                  <li>Boosts hydration with Hyaluronic Acid</li>
                  <li>Dermatologist-approved formula</li>
                  <li>Lightweight and fast-absorbing</li>
                  <li>Suitable for daily use</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProductdetailsPage;
