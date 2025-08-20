import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { Button } from "../ui/button";
import { Truck } from "lucide-react";
import InvoicePreview from "../Invoice";
import { toast, ToastContainer } from "react-toastify";


interface ShipRocketResponse {
  success: boolean;
  awb: string;
  shipment_id: number;
  order_id: number;
  courier_name: string;
  rate: number;
  label_url: string;
  pickup: {
    status: string;
    scheduled_date: null | string;
    token_number: null | string;
  };
}

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  // const [orders, setOrders] = useState();
  const [shipmentLoading, setShipmentLoading] = useState<
    Record<number, boolean>
  >({});
  const role = Cookies.get("user_role");
  const isAdmin = role === "admin";
  const isVendor = role === "vendor";
  const token = Cookies.get(isAdmin ? "admin_token" : "vendor_token");

  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState<boolean>(false);
const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
const [dimensions, setDimensions] = useState({
  height: "",
  length: "",
  breadth: "",
  weight: ""
});
const [errors, setErrors] = useState({
  weight: false,
  // Add others if you want to validate them too
});

  // Return request decision modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [returnRequestId, setReturnRequestId] = useState<number | null>(null);
  const [returnAction, setReturnAction] = useState<"APPROVE" | "REJECT" | "">("");
  const [returnNote, setReturnNote] = useState<string>("");
  const [returnLoading, setReturnLoading] = useState<boolean>(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const url = isAdmin
          ? `${import.meta.env.VITE_BASE_UR}admin/get-order/${orderId}`
          : `${import.meta.env.VITE_BASE_UR}vendor/get-order/${orderId}`;
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrder(response.data);
        console.log("Order Details:", response.data.shipments);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, token, isAdmin, isVendor]);

  const updateOrderItemStatus = async () => {
    if (!selectedStatus || !selectedItemId) return;

    setUpdatingStatus(true);
    setUpdateError(null);

    try {
      const url = isAdmin
        ? `${import.meta.env.VITE_BASE_UR}admin/update-order-status-admin`
        : `${import.meta.env.VITE_BASE_UR}vendor/update-order-item-status`;

      await axios.put(
        url,
        new URLSearchParams({
          OrderItemStatus: selectedStatus,
          OrderItemId: selectedItemId.toString(),
        }),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      // Update the local state to reflect the change
      setOrder((prevOrder) => ({
        ...prevOrder,
        orderItems: prevOrder.orderItems.map((item) =>
          item.id === selectedItemId
            ? { ...item, orderItemStatus: selectedStatus }
            : item
        ),
      }));

      setSelectedStatus("");
      setSelectedItemId(null);
    } catch (err) {
      setUpdateError(err.response?.data?.message || err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleShipmentSubmit = async () => {
    // Validate required fields
    if (!dimensions.weight) {
      setErrors({ ...errors, weight: true });
      return;
    }

    if (!currentOrderId) return;

    try {
      setIsShipmentModalOpen(false);
      setShipmentLoading((prev) => ({ ...prev, [currentOrderId]: true }));

      const response = await fetch(
        `${
          import.meta.env.VITE_BASE_UR
        }vendor/one-click-create-shiprocket-order/${currentOrderId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            height: dimensions.height,
            length: dimensions.length,
            breadth: dimensions.breadth,
            weight: dimensions.weight,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create ShipRocket order: ${response.statusText}`
        );
      }

      const data: ShipRocketResponse = await response.json();

      if (data.success && data.label_url) {
        toast.success("ShipRocket order created successfully");
        window.open(data.label_url, "_blank");
        // Optionally update the order status in the UI
      }
    } catch (error) {
      console.error("Error creating ShipRocket order:", error);
      toast.error(`Failed to create ShipRocket order: ${error.message}`);
      // alert(`Failed to create ShipRocket order: ${error.message}`);
    } finally {
      setShipmentLoading((prev) => ({ ...prev, [currentOrderId]: false }));
      setDimensions({ height: "", length: "", breadth: "", weight: "" });
      setCurrentOrderId(null);
    }
  };
  const handleStatusChange = (itemId, currentStatus) => {
    setSelectedItemId(itemId);
    setSelectedStatus(currentStatus);
  };

  enum OrderItemStatus {
    ORDERED = "ORDERED", // customer placed the order
    PROCESSING = "PROCESSING", // order is being prepared
    DISPATCHED = "DISPATCHED", // picked up / handed to courier
    IN_TRANSIT = "IN_TRANSIT", // moving through the courier network
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", // courier on the doorstep
    DELIVERED = "DELIVERED", // successfully delivered
    CANCELLED = "CANCELLED", // cancelled or returned
  }

  const statusOptions = [
    OrderItemStatus.ORDERED,
    OrderItemStatus.PROCESSING,
    OrderItemStatus.DISPATCHED,
    OrderItemStatus.IN_TRANSIT,
    OrderItemStatus.OUT_FOR_DELIVERY,
    OrderItemStatus.DELIVERED,
    OrderItemStatus.CANCELLED,
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-600 text-xl">Order not found</div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const options = {
      year: "numeric" as const,
      month: "long" as const,
      day: "numeric" as const,
      hour: "2-digit" as const,
      minute: "2-digit" as const,
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800";
      case "SHIPPED":
        return "bg-indigo-100 text-indigo-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "SUCCESS":
        return "bg-purple-100 text-purple-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "RETURNED":
        return "bg-orange-100 text-orange-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const openReturnModal = (rqId: number, action: "APPROVE" | "REJECT") => {
    setReturnRequestId(rqId);
    setReturnAction(action);
    setReturnNote("");
    setReturnError(null);
    setIsReturnModalOpen(true);
  };

  const submitReturnDecision = async () => {
    if (!isVendor) return; // safety: vendor-only endpoint
    if (!returnRequestId || !returnAction) return;
    try {
      setReturnLoading(true);
      setReturnError(null);

      const url = `${import.meta.env.VITE_BASE_UR}vendor/return-requests/decide`;
      await axios.post(
        url,
        new URLSearchParams({
          returnRequestId: String(returnRequestId),
          action: returnAction,
          note: returnNote || "",
        }),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      // Optimistically update local state
      setOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          orderItems: prev.orderItems?.map((oi) => ({
            ...oi,
            returnRequests: oi.returnRequests?.map((rr) =>
              rr.id === returnRequestId
                ? {
                    ...rr,
                    status: returnAction === "APPROVE" ? "APPROVED" : "REJECTED",
                    vendorNote: returnNote,
                  }
                : rr
            ),
          })),
        };
      });

      toast.success(`Return request ${returnAction === "APPROVE" ? "approved" : "rejected"}`);
      setIsReturnModalOpen(false);
      setReturnRequestId(null);
      setReturnAction("");
      setReturnNote("");
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : (err as Error).message || "Failed to update";
      setReturnError(msg);
      toast.error(msg);
    } finally {
      setReturnLoading(false);
    }
  };

  return (
    <>
    <ToastContainer 
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
    
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Order Details</h1>
          <div className="flex gap-2 items-center">
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>
            {/* <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                order.orderStatus
              )}`}
            >
              {order.orderStatus}
            </span> */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInvoice(true)}
              className=" bg-green-600 text-white hover:bg-green-700 hover:text-white"
            >
              Download Invoice
            </Button>
          </div>
        </div>

        {/* Update Status Modal */}
        {selectedItemId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Update Order Item Status
              </h3>

              {updateError && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                  {updateError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedItemId(null);
                    setSelectedStatus("");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  disabled={updatingStatus}
                >
                  Cancel
                </button>
                <button
                  onClick={updateOrderItemStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={updatingStatus}
                >
                  {updatingStatus ? "Updating..." : "Update Status"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Summary Card */}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-100">
          <div className="p-6 bg-gradient-to-r from-gray-800 to-gray-700 text-white">
            <h2 className="text-xl font-semibold">Order : {order.id}</h2>
            <p className="text-gray-300">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                PAYMENT METHOD
              </h3>
              <p className="font-medium capitalize">{order.paymentMode}</p>
              <p className="text-sm text-gray-500 mt-1">
                ID: {order.paymentOrderId}
              </p>
            </div>

            {/* <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                ORDER TOTAL
              </h3>
              <p className="font-medium">₹{order.totalAmount}</p>
              <div className="flex text-sm text-gray-500 mt-1 space-x-2">
                <span>GST: ₹{order.gst}</span>
                <span>Discount: ₹{order.discount}</span>
              </div>
            </div> */}

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                CUSTOMER
              </h3>
              <p className="font-medium">{order.user.name}</p>
              <p className="text-sm text-gray-500">{order.user.email}</p>
              <p className="text-sm text-gray-500">{order.user.phone}</p>
            </div>
          </div>
        </div>

        {/* Shipping and Billing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
              Shipping Address
            </h3>
            <div className="space-y-2">
              <p className="font-medium">
              {order.address.fristname} {order.address.lastname}
              </p>
              <p>
              {order.address.houseNo}
              </p>
              <p>
              {order.address.street}
              </p>
              <p>
              Landmark: {order.address.landmark}
              </p>
              <p>
              {order.address.city}, {order.address.district}
              </p>
              <p>
              State: {order.address.state}
              </p>
              <p>
              Country: {order.address.country}
              </p>
              <p>
              Mobile: {order.address.mobile}
              </p>
              <p>
              PIN: {order.address.pincode}
              </p>
              {order.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-500">
                DELIVERY NOTES
                </p>
                <p className="italic">"{order.notes}"</p>
              </div>
              )}
            </div>
          </div>

          {/* Shipment Details or Ship Now Button */}
          {isVendor &&
            (order.shipments && order.shipments.length > 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                  Shipment Details
                </h3>
                {order.shipments.map((shipment) => (
                  <div key={shipment.id} className="mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-800">
                          AWB: {shipment.awb}
                        </div>
                        <div className="text-sm text-gray-600">
                          Courier: {shipment.courierName}
                        </div>
                        <div className="text-sm text-gray-600">
                          Status: {shipment.status}
                        </div>
                        <div className="text-sm text-gray-600">
                          Rate: ₹{shipment.rate}
                        </div>
                        <div className="text-sm text-gray-600">
                          Pickup Status: {shipment.pickupStatus}
                        </div>
                        <div className="text-sm text-gray-600">
                          Created: {formatDate(shipment.createdAt)}
                        </div>
                      </div>
                      {shipment.labelUrl && (
                        <a
                          href={shipment.labelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          Download Label
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white flex justify-center items-center rounded-xl shadow-lg p-6 border border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentOrderId(order.id);
                    setIsShipmentModalOpen(true);
                  }}
                  disabled={shipmentLoading[order.id]}
                  className="mb-6 bg-blue-600 text-white hover:bg-blue-700 hover:text-white flex items-center"
                >
                  {shipmentLoading[order.id] ? (
                    "Processing..."
                  ) : (
                    <>
                      <Truck className="h-4 w-4 mr-2" />
                      Ship Now
                    </>
                  )}
                </Button>
              </div>
            ))}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Order Items</h3>
          </div>

          <div className="divide-y divide-gray-100">
            {order.orderItems.map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex flex-col md:flex-row">
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 mb-4 md:mb-0">
                    <img
                      src={`${import.meta.env.VITE_BASE_URL_IMG}${
                        item.variant.images[0]
                      }`}
                      alt={item.variant.product.name}
                      className="w-full h-full object-contain object-top"
                    />
                  </div>

                  <div className="ml-0 md:ml-6 flex-1">
                    <div className="flex flex-col md:flex-row md:justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {item.variant.product.name}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Vendor: {item.vendor?.name}
                        </p>
                        {item.attributes.map((attr, idx) => (
                          <p key={idx} className="text-sm text-gray-500">
                            {attr.key}: {attr.value}
                          </p>
                        ))}
                      </div>

                      <div className="mt-4 md:mt-0 text-right">
                        <p className="text-gray-900 font-medium">
                          ₹{item.variant.sellingprice}
                        </p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                        {/* <p className="text-sm text-gray-500">
                          Total: ₹
                          {(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </p> */}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          item.orderItemStatus
                        )}`}
                      >
                        {item.orderItemStatus}
                      </span>
                      <button
                        onClick={() =>
                          handleStatusChange(item.id, item.orderItemStatus)
                        }
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Update Status
                      </button>
                    </div>

                    {/* Return Requests Section */}
                    {item.returnRequests && item.returnRequests.length > 0 && (
                      <div className="mt-6 border-t pt-4">
                        <h5 className="text-sm font-semibold text-gray-800 mb-3">Return Requests</h5>
                        <div className="space-y-3">
                          {item.returnRequests.map((rr) => (
                            <div key={rr.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(rr.status)}`}>
                                      {rr.status}
                                    </span>
                                    <span className="text-[11px] text-gray-500">#{rr.id}</span>
                                  </div>
                                  <p className="text-sm text-gray-800"><span className="font-medium">Reason:</span> {rr.reason}</p>
                                  {rr.vendorNote && (
                                    <p className="text-xs text-gray-600 mt-1"><span className="font-medium">Vendor note:</span> {rr.vendorNote}</p>
                                  )}
                                  {rr.adminNote && (
                                    <p className="text-xs text-gray-600"><span className="font-medium">Admin note:</span> {rr.adminNote}</p>
                                  )}
                                  <p className="text-[11px] text-gray-500 mt-1">Requested by {rr.user?.name || "User"} on {formatDate(rr.createdAt)}</p>
                                </div>
                                {isVendor && rr.status === "PENDING" && (
                                  <div className="flex flex-col gap-2">
                                    <button
                                      className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                                      onClick={() => openReturnModal(rr.id, "APPROVE")}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                                      onClick={() => openReturnModal(rr.id, "REJECT")}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">
              Order Timeline
            </h3>
          </div>
          <div className="p-6">
            <div className="relative">
              <div className="mb-6 ml-6">
                <div className="absolute w-4 h-4 bg-blue-500 rounded-full mt-1.5 -left-2 border-4 border-white"></div>
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">
                      Order Confirmed
                    </h4>
                    <p className="text-sm text-gray-500">
                      Your order has been confirmed
                    </p>
                  </div>
                  <time className="text-sm text-gray-500 sm:mt-0 mt-1">
                    {formatDate(order.createdAt)}
                  </time>
                </div>
              </div>

              <div className="mb-6 ml-6">
                <div className="absolute w-4 h-4 bg-green-500 rounded-full mt-1.5 -left-2 border-4 border-white"></div>
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <div>
                  <h4 className="text-base font-medium text-gray-900">
                    {order.paymentMode === "COD"
                    ? "Pending Payment"
                    : "Payment Received"}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {order.paymentMode === "COD"
                    ? "Payment will be collected on delivery"
                    : `Payment successful via ${order.paymentMode}`}
                  </p>
                  </div>
                  <time className="text-sm text-gray-500 sm:mt-0 mt-1">
                  {formatDate(order.createdAt)}
                  </time>
                </div>
              </div>

              {order.orderItems.some(
                (item) => item.orderItemStatus === "DELIVERED"
              ) && (
                <div className="ml-6">
                  <div className="absolute w-4 h-4 bg-purple-500 rounded-full mt-1.5 -left-2 border-4 border-white"></div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900">
                        Items Delivered
                      </h4>
                      <p className="text-sm text-gray-500">
                        Your items have been delivered
                      </p>
                    </div>
                    <time className="text-sm text-gray-500 sm:mt-0 mt-1">
                      {formatDate(
                        order.orderItems.find(
                          (item) => item.orderItemStatus === "DELIVERED"
                        )?.updatedAt || new Date()
                      )}
                    </time>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showInvoice && (
        <InvoicePreview order={order} onClose={() => setShowInvoice(false)} />
      )}
      {isShipmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Enter Package Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={dimensions.height}
                  onChange={(e) =>
                    setDimensions({ ...dimensions, height: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Length (cm)
                </label>
                <input
                  type="number"
                  value={dimensions.length}
                  onChange={(e) =>
                    setDimensions({ ...dimensions, length: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Breadth (cm)
                </label>
                <input
                  type="number"
                  value={dimensions.breadth}
                  onChange={(e) =>
                    setDimensions({ ...dimensions, breadth: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Weight (g)*
                </label>
                <input
                  type="number"
                  value={dimensions.weight}
                  onChange={(e) => {
                    setDimensions({ ...dimensions, weight: e.target.value });
                    setErrors({ ...errors, weight: false });
                  }}
                  className={`mt-1 block w-full border ${
                    errors.weight ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required
                />
                {errors.weight && (
                  <p className="mt-1 text-sm text-red-600">
                    Weight is required
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsShipmentModalOpen(false);
                  setDimensions({
                    height: "",
                    length: "",
                    breadth: "",
                    weight: "",
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleShipmentSubmit}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Confirm & Ship
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Decision Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-2">
              {returnAction === "APPROVE" ? "Approve Return Request" : "Reject Return Request"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Add an optional note for the customer/vendor records.
            </p>

            {returnError && (
              <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{returnError}</div>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-24"
              placeholder="Write a note (optional)"
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsReturnModalOpen(false);
                  setReturnRequestId(null);
                  setReturnAction("");
                  setReturnNote("");
                  setReturnError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={returnLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReturnDecision}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                  returnAction === "APPROVE" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={returnLoading}
              >
                {returnLoading ? "Submitting..." : returnAction === "APPROVE" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    </>
  );
};

export default OrderDetails;
