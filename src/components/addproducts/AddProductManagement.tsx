import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import JoditEditor from "jodit-react";

const AddProductManagement = () => {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    mainCategoryId: "",
    subCategoryId: "",
    subSubCategoryId: "",
    vendorId: "",
    variants: [
      {
        sku: "",
        price: "",
        stock: "",
        originalPrice: "",
        sellingprice: "",
        attributes: [{ key: "Size", value: "" }],
      },
    ],
  });

  const editor = useRef(null);

  // Jodit configuration

  const joditConfig = {
    readonly: false,
    toolbar: true,
    spellcheck: true,
    language: "en",
    height: 400,
    toolbarButtonSize: "middle",
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: true,

    // Clipboard settings
    clipboard: {
      // Try different paste actions:
      // 'insert_as_html' - keeps original HTML
      // 'insert_clear_html' - cleans HTML
      // 'insert_only_text' - plain text only
      defaultActionOnPaste: "insert_as_html",

      // Disable all paste filters temporarily for testing
      formaters: [],

      // Allow pasting from all sources
      allowNativePaste: true,

      // Don't ask before pasting
      askBeforePasteFromWord: false,
      askBeforePasteHTML: false,
    },

    // Disable clean HTML for testing
    cleanHTML: false,
    //    style: {
    //     'list-style-type': 'disc', // For unordered lists
    //     'list-style-position': 'inside'
    // },

    // Disable all paste plugins temporarily
    disablePlugins: ["paste", "pasteStorage", "clipboard"],

    buttons: [
      "source",
      "|",
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "|",
      "ul",
      "ol",
      "|",
      "font",
      "fontsize",
      "brush",
      "paragraph",
      "|",
      "table",
      "link",
      "|",
      "align",
      "undo",
      "redo",
      "|",
      "hr",
      "fullsize",
    ],
  };

  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const fileInputRef = useRef(null);
  const role = Cookies.get("user_role");
  const vendorId = JSON.parse(Cookies.get("user_data"))?.id;

  const isAdmin = role === "admin";
  const isVendor = role === "vendor";

  const token = Cookies.get("admin_token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch main categories with their subcategories and sub-subcategories
        const mainCategoriesResponse = await axios.get(
          `${import.meta.env.VITE_BASE_UR}web/get-all-category`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setMainCategories(mainCategoriesResponse.data.categories || []);

        // Fetch vendors only if admin
        if (isAdmin) {
          const vendorsResponse = await axios.get(
            `${import.meta.env.VITE_BASE_UR}admin/all-vendors`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setVendors(vendorsResponse.data.vendors || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchData();
  }, []);

  // calculate sgst and cgst to original price and fill in selling price and price

  // console.log("mainCategories", mainCategories);

  useEffect(() => {
    if (product.variants.length > 0 && product.mainCategoryId) {
      const selectedMainCategory = mainCategories.find(
        (cat) => cat.id === parseInt(product.mainCategoryId)
      );
      const sgstRate = selectedMainCategory?.sgst || 0;
      const cgstRate = selectedMainCategory?.cgst || 0;

      const updatedVariants = product.variants.map((variant) => {
        const originalPrice = parseFloat(variant.originalPrice) || 0;
        const sgst = (originalPrice * (sgstRate / 100)).toFixed(2);
        const cgst = (originalPrice * (cgstRate / 100)).toFixed(2);
        const sgstRounded = Math.ceil(parseFloat(sgst));
        const cgstRounded = Math.ceil(parseFloat(cgst));
        const totalPrice = (originalPrice + sgstRounded + cgstRounded).toFixed(
          2
        );

        // Only auto-update sellingprice if it hasn't been manually edited
        const sellingprice = variant.isManualEdit
          ? variant.sellingprice
          : totalPrice;

        return {
          ...variant,
          sgst,
          cgst,
          sellingprice,
          price: totalPrice, // Always keep price updated (for reference)
        };
      });

      const isChanged = updatedVariants.some(
        (v, i) =>
          v.price !== product.variants[i].price ||
          v.sgst !== product.variants[i].sgst ||
          v.cgst !== product.variants[i].cgst ||
          v.sellingprice !== product.variants[i].sellingprice
      );

      if (isChanged) {
        setProduct((prev) => ({ ...prev, variants: updatedVariants }));
      }
    }
  }, [product.variants, product.mainCategoryId, mainCategories]);

  useEffect(() => {
    // When main category changes, update sub categories
    if (product.mainCategoryId) {
      const selectedMainCategory = mainCategories.find(
        (cat) => cat.id === parseInt(product.mainCategoryId)
      );
      setSubCategories(selectedMainCategory?.subCategories || []);
      setProduct((prev) => ({
        ...prev,
        subCategoryId: "",
        subSubCategoryId: "",
      }));
    }
  }, [product.mainCategoryId, mainCategories]);

  useEffect(() => {
    // When sub category changes, update sub-sub categories
    if (product.subCategoryId) {
      const selectedSubCategory = subCategories.find(
        (subCat) => subCat.id === parseInt(product.subCategoryId)
      );
      setSubSubCategories(selectedSubCategory?.subSubCategories || []);
      setProduct((prev) => ({
        ...prev,
        subSubCategoryId: "",
      }));
    }
  }, [product.subCategoryId, subCategories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (variantIndex, e) => {
    const { name, value } = e.target;
    setProduct((prev) => {
      const updatedVariants = [...prev.variants];

      // If sellingprice is manually changed, mark it as edited
      if (name === "sellingprice") {
        updatedVariants[variantIndex] = {
          ...updatedVariants[variantIndex],
          [name]: value,
          isManualEdit: true, // Mark as manually edited
        };
      } else {
        // For other fields, reset isManualEdit if originalPrice changes
        updatedVariants[variantIndex] = {
          ...updatedVariants[variantIndex],
          [name]: value,
          isManualEdit:
            name === "originalPrice"
              ? false
              : updatedVariants[variantIndex].isManualEdit,
        };
      }

      return { ...prev, variants: updatedVariants };
    });
  };

  const handleAttributeChange = (variantIndex, attrIndex, e) => {
    const { name, value } = e.target;
    const updatedVariants = [...product.variants];
    updatedVariants[variantIndex].attributes[attrIndex][name] = value;
    setProduct((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const addVariant = () => {
    setProduct((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          sku: "",
          price: "",
          stock: "",
          originalPrice: "",
          sellingprice: "",
          attributes: [{ key: "size", value: "" }],
        },
      ],
    }));
  };

  const addAttribute = (variantIndex) => {
    const updatedVariants = [...product.variants];
    updatedVariants[variantIndex].attributes.push({ key: "", value: "" });
    setProduct((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const removeVariant = (index) => {
    if (product.variants.length <= 1) return;
    const updatedVariants = product.variants.filter((_, i) => i !== index);
    setProduct((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const removeAttribute = (variantIndex, attrIndex) => {
    const updatedVariants = [...product.variants];
    if (updatedVariants[variantIndex].attributes.length <= 0) return;
    updatedVariants[variantIndex].attributes = updatedVariants[
      variantIndex
    ].attributes.filter((_, i) => i !== attrIndex);
    setProduct((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("name", product.name);
      formData.append("description", product.description);
      formData.append("mainCategoryId", product.mainCategoryId);
      formData.append("subCategoryId", product.subCategoryId);
      formData.append("subSubCategoryId", product.subSubCategoryId);
      formData.append("vendorId", isAdmin ? product.vendorId : vendorId);
      formData.append("variants", JSON.stringify(product.variants));

      images.forEach((image) => {
        formData.append(`images_0`, image);
      });

      for (let i = 0; i < images.length; i++) {
        if (images[i].size > 5 * 1024 * 1024) {
          toast.error(`Image "${images[i].name}" exceeds 5MB size limit.`);
          setIsLoading(false);
          return;
        }
      }

      const token = isVendor
        ? Cookies.get("vendor_token")
        : Cookies.get("admin_token");
      const apiUrl = isVendor
        ? `${import.meta.env.VITE_BASE_UR}vendor/add-product`
        : `${import.meta.env.VITE_BASE_UR}admin/add-product`;

      await axios.post(apiUrl, formData, {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(true);
      toast.success("Product added successfully!");
      // Reset form
      setProduct({
        name: "",
        description: "",
        mainCategoryId: "",
        subCategoryId: "",
        subSubCategoryId: "",
        vendorId: "",
        variants: [
          {
            sku: "",
            price: "",
            stock: "",
            sellingprice: "",
            originalPrice: "",
            attributes: [{ key: "size", value: "" }],
          },
        ],
      });
      setImages([]);
    } catch (error) {
      let message = "Error adding product.";
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          message = error.response.data.message;
        } else if (error.response?.data?.error) {
          message = error.response.data.error;
        }
      }
      toast.error(message);
      console.error("Error adding product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingCategories) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 ">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            {success && (
              <div className="mb-6 p-4 bg-green-50 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Product added successfully!
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={product.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mainCategoryId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Main Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="mainCategoryId"
                    name="mainCategoryId"
                    value={product.mainCategoryId}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                  >
                    <option value="">Select a category</option>
                    {mainCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="subCategoryId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Sub Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subCategoryId"
                    name="subCategoryId"
                    value={product.subCategoryId}
                    onChange={handleChange}
                    required
                    disabled={!product.mainCategoryId}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                  >
                    <option value="">Select a sub-category</option>
                    {subCategories.map((subCategory) => (
                      <option key={subCategory.id} value={subCategory.id}>
                        {subCategory.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="subSubCategoryId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Sub-Sub Category
                  </label>
                  <select
                    id="subSubCategoryId"
                    name="subSubCategoryId"
                    value={product.subSubCategoryId}
                    onChange={handleChange}
                    disabled={!product.subCategoryId}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                  >
                    <option value="">Select a sub-sub-category</option>
                    {subSubCategories.map((subSubCategory) => (
                      <option key={subSubCategory.id} value={subSubCategory.id}>
                        {subSubCategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isAdmin && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="vendorId"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Vendor <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="vendorId"
                      name="vendorId"
                      value={product.vendorId}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                    >
                      <option value="">Select a vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {isVendor && (
                <input type="hidden" name="vendorId" value={vendorId} />
              )}

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <JoditEditor
                  ref={editor}
                  value={product.description}
                  config={joditConfig}
                  onBlur={(newContent) =>
                    setProduct((prev) => ({ ...prev, description: newContent }))
                  }
                  className="mt-1 bg-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Product Variants
                  </h3>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-700 hover:bg-gold-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                  >
                    Add Variant
                  </button>
                </div>

                <div className="space-y-4">
                  {product.variants.map((variant, variantIndex) => (
                    <div
                      key={variantIndex}
                      className="bg-gray-50 p-4 rounded-lg relative border border-gray-200"
                    >
                      {product.variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(variantIndex)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label
                            htmlFor={`sku-${variantIndex}`}
                            className="block text-sm font-medium text-gray-700"
                          >
                            SKU <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id={`sku-${variantIndex}`}
                            name="sku"
                            value={variant.sku}
                            onChange={(e) =>
                              handleVariantChange(variantIndex, e)
                            }
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`stock-${variantIndex}`}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Stock <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id={`stock-${variantIndex}`}
                            name="stock"
                            value={variant.stock}
                            onChange={(e) =>
                              handleVariantChange(variantIndex, e)
                            }
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                            min="0"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`originalPrice-${variantIndex}`}
                            className="block text-sm font-medium text-gray-700"
                          >
                            MPR <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">
                                ₹
                              </span>
                            </div>
                            <input
                              type="number"
                              id={`originalPrice-${variantIndex}`}
                              name="originalPrice"
                              value={variant.originalPrice || ""}
                              onChange={(e) =>
                                handleVariantChange(variantIndex, e)
                              }
                              required
                              className="border border-gray-300 block w-full pl-7 pr-5 sm:text-sm rounded-md py-2 px-3"
                              placeholder="0.00"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label
                            htmlFor={`sellingprice-${variantIndex}`}
                            className="block text-sm font-medium text-gray-700 mt-2"
                          >
                            Selling Price{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">
                                ₹
                              </span>
                            </div>
                            <input
                              type="number"
                              id={`sellingprice-${variantIndex}`}
                              name="sellingprice"
                              value={variant.sellingprice}
                              onChange={(e) =>
                                handleVariantChange(variantIndex, e)
                              }
                              required
                              className="border border-gray-300 block w-[300px] pl-7 pr-4 sm:text-sm rounded-md py-2 px-3"
                              placeholder="0.00"
                              min="0"
                            />
                          </div>
                        </div>
                        <input
                          type="hidden"
                          id={`price-${variantIndex}`}
                          name="price"
                          value={variant.price}
                        />
                      </div>

                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Attributes
                          </h3>
                          <button
                            type="button"
                            onClick={() => addAttribute(variantIndex)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-700 hover:bg-gold-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                          >
                            Add Attribute
                          </button>
                        </div>
                        <div className="space-y-4">
                          {variant.attributes.map((attribute, attrIndex) => (
                            <div
                              key={attrIndex}
                              className="grid grid-cols-1 gap-4 sm:grid-cols-2 relative"
                            >
                              {variant.attributes.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeAttribute(variantIndex, attrIndex)
                                  }
                                  className="absolute top-0 right-0 text-gray-400 hover:text-red-500"
                                >
                                  <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              )}
                              <div>
                                <label
                                  htmlFor={`attr-name-${variantIndex}-${attrIndex}`}
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Attribute Name
                                </label>
                                <input
                                  type="text"
                                  id={`attr-name-${variantIndex}-${attrIndex}`}
                                  name="key"
                                  value={attribute.key}
                                  onChange={(e) =>
                                    handleAttributeChange(
                                      variantIndex,
                                      attrIndex,
                                      e
                                    )
                                  }
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                                  placeholder="e.g. color, size"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`attr-value-${variantIndex}-${attrIndex}`}
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Attribute Value
                                </label>
                                <input
                                  type="text"
                                  id={`attr-value-${variantIndex}-${attrIndex}`}
                                  name="value"
                                  value={attribute.value}
                                  onChange={(e) =>
                                    handleAttributeChange(
                                      variantIndex,
                                      attrIndex,
                                      e
                                    )
                                  }
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                                  placeholder="e.g. large"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Product Images
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  multiple
                  className="hidden"
                  accept="image/*"
                />
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-gold-600 hover:text-gold-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gold-500"
                      >
                        <span onClick={triggerFileInput}>Upload files</span>
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
                {images.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {Array.from(images).map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index}`}
                          className="h-24 w-full object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setImages((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gold-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white bg-black"
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
                        Processing...
                      </>
                    ) : (
                      "Add Product"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductManagement;
