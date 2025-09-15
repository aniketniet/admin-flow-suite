
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Header } from "../layout/Header";
import { Sidebar } from "../layout/Sidebar";

const ProductdetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Extract return URL parameters
  const returnParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== 'returnPage') {  // Skip old returnPage if it exists
      returnParams.set(key, value);
    }
  });
  const returnUrl = returnParams.toString() ? `?${returnParams.toString()}` : "";
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  const role = Cookies.get("user_role");
  const isAdmin = role === "admin";
  const isVendor = role === "vendor";
  const token = Cookies.get(isAdmin ? "admin_token" : "vendor_token");

  const handleBackToProducts = () => {
    const productsPath = isAdmin ? "/products" : "/vendor/products";
    navigate(`${productsPath}${returnUrl}`);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        let url = "";
        let options: RequestInit = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        if (isAdmin) {
          url = `${import.meta.env.VITE_BASE_UR}admin/get-product/${productId}`;
        } else if (isVendor) {
          url = `${
            import.meta.env.VITE_BASE_UR
          }vendor/get-product/${productId}`;
        }

        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error("Failed to fetch product");
        }

        const data = await response.json();
        setProduct(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, token, isAdmin, isVendor]);

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
  const price = parseFloat(variant.originalPrice);
  const sellingPrice = parseFloat(variant.sellingprice);

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="min-h-screen max-w-6xl bg-white text-gray-900  ">
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
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={handleBackToProducts}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Products</span>
              </Button>
              <h1 className="text-2xl font-bold">Product Details</h1>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Product Images */}
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <div className="bg-gray-50 p-8 flex items-center justify-center h-96 mb-4">
                <img
                  src={`${import.meta.env.VITE_BASE_URL_IMG}${
                    variant.images[selectedImage]
                  }`}
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
                      src={`${import.meta.env.VITE_BASE_URL_IMG}${image}`}
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
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{sellingPrice.toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    ₹{price.toFixed(2)}
                  </span>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    {Math.round(((price - sellingPrice) / price) * 100)}% OFF
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Inclusive of all taxes
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-medium mb-4">Description</h2>
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProductdetailsPage;
