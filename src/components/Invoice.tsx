import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import logo from "../../public/logo.png";

const InvoicePreview = ({ order, onClose }) => {
  const invoiceRef = useRef();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${order.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try printing instead.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!order) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Get vendor info from the first order item
  const vendor = order.orderItems[0]?.vendor || {
    name: "Mahakal Supplier",
    address:
      "Plote no 1, Dwarka sector 1, New delhi, New Delhi, Delhi, India, PIN: 110070",
    stateCode: "07", // Delhi state code
    gstin: "07ABCDE1234F1Z5",
  };

  // Get states for comparison
  const vendorState = vendor.pickupAddresses?.[0]?.state || "";
  const customerState = order.address.state || " ";
  const isSameState = vendorState.toLowerCase() === customerState.toLowerCase();

  // Seller info
  const soldBy = {
    name: vendor.name,
    address: vendor.pickupAddresses?.[0]?.address || vendor.address,
    gstin: vendor.gst_no || " ",
    stateCode: "07", // Delhi state code
  };

  // Billing and Shipping from order.address
  const billingAddress = {
    name:
      `${order.address.fristname || ""} ${
        order.address.lastname || ""
      }`.trim() || " ",
    address: [
      order.address.houseNo && `H. No ${order.address.houseNo}`,
      order.address.street,
      `${order.address.city}, ${order.address.district}`,
      `PIN: ${order.address.pincode}`,
      order.address.country || " ",
    ]
      .filter(Boolean)
      .join(", "),
    state: order.address.state || " ",
    stateCode: "07", // Delhi state code
  };

  const shippingAddress = {
    placeOfSupply: order.address.city || " ",
    placeOfDelivery: order.address.city || "",
  };

  // Prepare items with proper GST calculations and calculate total amounts
  let totalNetAmount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalTaxAmount = 0;
  let grandTotal = 0;

  const items = order.orderItems.map((item) => {
    const sellingPrice = parseFloat(item.variant.sellingprice);
    const product = item.variant.product;
    const mainCategory = product.mainCategory;

    // Get GST rates from main category
    const cgstRate = mainCategory.cgst ? parseFloat(mainCategory.cgst) : 0;
    const sgstRate = mainCategory.sgst ? parseFloat(mainCategory.sgst) : 0;
    const igstRate = isSameState ? 0 : cgstRate + sgstRate; // IGST is sum of CGST+SGST when inter-state

    // Calculate GST inclusive price breakdown
    const gstRate = isSameState ? cgstRate + sgstRate : igstRate;
    const gstMultiplier = 1 + gstRate / 100;
    const unitPriceExclGST = sellingPrice / gstMultiplier;

    const netAmount = unitPriceExclGST * item.quantity;
    const cgstAmount = isSameState ? netAmount * (cgstRate / 100) : 0;
    const sgstAmount = isSameState ? netAmount * (sgstRate / 100) : 0;
    const igstAmount = !isSameState ? netAmount * (igstRate / 100) : 0;
    const taxAmount = cgstAmount + sgstAmount + igstAmount;
    const totalAmount = netAmount + taxAmount;

    // Add to totals
    totalNetAmount += netAmount;
    totalCgst += cgstAmount;
    totalSgst += sgstAmount;
    totalIgst += igstAmount;
    totalTaxAmount += taxAmount;
    grandTotal += totalAmount;

    return {
      description: product.name,
      attributes: item.attributes,
      hsn: "3307", // Default HSN for example
      unitPrice: unitPriceExclGST,
      quantity: item.quantity,
      netAmount: netAmount,
      cgstRate: isSameState ? cgstRate : 0,
      sgstRate: isSameState ? sgstRate : 0,
      igstRate: igstRate,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      igstAmount: igstAmount,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
      taxType: isSameState ? "CGST+SGST" : "IGST",
    };
  });

  const numberToWords = (num) => {
    const a = [
      "",
      "One ",
      "Two ",
      "Three ",
      "Four ",
      "Five ",
      "Six ",
      "Seven ",
      "Eight ",
      "Nine ",
      "Ten ",
      "Eleven ",
      "Twelve ",
      "Thirteen ",
      "Fourteen ",
      "Fifteen ",
      "Sixteen ",
      "Seventeen ",
      "Eighteen ",
      "Nineteen ",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const number = parseFloat(num).toFixed(2).split(".");
    const main_number = number[0];
    const point_number = number[1];

    const inWords = (num) => {
      if ((num = num.toString()).length > 9) return "overflow";
      const n = ("000000000" + num)
        .substr(-9)
        .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) return;
      let str = "";
      str +=
        n[1] != 0
          ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Crore "
          : "";
      str +=
        n[2] != 0
          ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Lakh "
          : "";
      str +=
        n[3] != 0
          ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Thousand "
          : "";
      str +=
        n[4] != 0
          ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "Hundred "
          : "";
      str +=
        n[5] != 0
          ? (str != "" ? "and " : "") +
            (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]])
          : "";
      return str;
    };
    let str = inWords(main_number) + "Rupees";
    if (point_number > 0) {
      str += " and " + inWords(point_number) + " Paise";
    }
    return str.trim().replace(/\s+/g, " ") + " Only";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Invoice Preview
          </h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {isGeneratingPDF ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>

        <div
          ref={invoiceRef}
          className="p-8 bg-white"
          style={{ width: "210mm", minHeight: "297mm", margin: "0 auto" }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="text-left">
              <img src={logo} alt="Logo" className="w-48 mb-2" />
              <h1 className="text-2xl font-bold">{soldBy.name}</h1>
              <p className="text-sm">{soldBy.address}</p>
              <p className="text-sm">State: {vendorState}</p>
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold">
                Tax Invoice/Bill of Supply/Cash Memo
              </h1>
              <p className="text-sm">(Original for Recipient)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-4">
            <div>
              <p className="font-bold">Sold By :</p>
              <p className="text-sm font-semibold">{soldBy.name}</p>
              <p className="text-sm">{soldBy.address}</p>
              <div className="mt-4 text-sm">
                <p>
                  <span className="font-bold">GST Registration No:</span>{" "}
                  {soldBy.gstin}
                </p>
                <p>
                  <span className="font-bold">State:</span> {vendorState}
                </p>
              </div>
            </div>
            <div className="text-sm">
              <div className="mb-4">
                <p className="font-bold">Billing Address :</p>
                <p>{billingAddress.name}</p>
                <p>{billingAddress.address}</p>
                <p>
                  <span className="font-bold">State:</span> {customerState}
                </p>
              </div>

              <div className="mt-4">
                <p>
                  <span className="font-bold">Place of supply:</span>{" "}
                  {shippingAddress.placeOfSupply}
                </p>
                <p>
                  <span className="font-bold">Place of delivery:</span>{" "}
                  {shippingAddress.placeOfDelivery}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-4 text-sm border-y border-gray-300 py-2">
            <div>
              <p>
                <span className="font-bold">Order Number:</span> {order.id}
              </p>
              <p>
                <span className="font-bold">Order Date:</span>{" "}
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div>
              <p>
                <span className="font-bold">Invoice Number:</span>{" "}
                {`INV-${order.id}`}
              </p>
              <p>
                <span className="font-bold">Invoice Date:</span>{" "}
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse border-y-2 border-black">
            <thead>
              <tr className="text-left">
                <th className="p-1">Sl No</th>
                <th className="p-1 w-2/5">Description</th>
                <th className="p-1 text-right">Unit Price</th>
                <th className="p-1 text-right">Qty</th>
                {isSameState ? (
                  <>
                    <th className="p-1 text-right">CGST (%)</th>
                    <th className="p-1 text-right">SGST (%)</th>
                  </>
                ) : (
                  <th className="p-1 text-right" colSpan="2">
                    IGST (%)
                  </th>
                )}
                <th className="p-1 text-right">Tax Amt</th>
                <th className="p-1 text-right">Total Amt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-t border-gray-300">
                  <td className="p-1">{index + 1}</td>
                  <td className="p-1">
                    {item.description}
                    {item.attributes &&
                      item.attributes.map((attr, i) => (
                        <span key={i} className="block text-xs">
                          {attr.key}: {attr.value}
                        </span>
                      ))}
                  </td>
                  <td className="p-1 text-right">
                    ₹{item.unitPrice.toFixed(2)}
                  </td>
                  <td className="p-1 text-right">{item.quantity}</td>
                  {isSameState ? (
                    <>
                      <td className="p-1 text-right">
                        {item.cgstRate > 0 ? `${item.cgstRate}%` : "-"}
                      </td>
                      <td className="p-1 text-right">
                        {item.sgstRate > 0 ? `${item.sgstRate}%` : "-"}
                      </td>
                    </>
                  ) : (
                    <td className="p-1 text-right" colSpan="2">
                      {item.igstRate > 0 ? `${item.igstRate}%` : "-"}
                    </td>
                  )}
                  <td className="p-1 text-right">
                    ₹{item.taxAmount.toFixed(2)}
                  </td>
                  <td className="p-1 text-right font-bold">
                    ₹{item.totalAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-black font-bold">
                <td colSpan={isSameState ? 7 : 6} className="p-2 text-right">
                  TOTAL:
                </td>
                <td className="p-2 text-right">₹{grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-2 text-sm">
            <span className="font-bold">Amount in Words:</span>{" "}
            {numberToWords(grandTotal)}
          </div>

          <div className="mt-8 text-sm">
            <p>
              <span className="font-bold">Payment Mode:</span>{" "}
              {order.paymentMode === "COD"
                ? "Cash on Delivery"
                : order.paymentMode}
            </p>
            <p>
              <span className="font-bold">Order Status:</span>{" "}
              {order.orderStatus}
            </p>
            <p className="mt-2 font-semibold">
              GST Type:{" "}
              {isSameState ? "CGST + SGST (Intra-State)" : "IGST (Inter-State)"}
            </p>
          </div>

          {/* <div className="flex justify-between items-end mt-16">
            <div>
                 <p className="text-sm">Whether tax is payable under reverse charge - No</p>
            </div>
            <div className="text-center">
                 <p className="text-sm font-bold">For {soldBy.name}</p>
                 <div className="h-12"></div>
                 <p className="border-t border-black pt-1 text-sm">Authorized Signatory</p>
            </div>
          </div> */}

          <div className="flex justify-end items-end mt-16">
            {/* <div>
    <p className="text-sm">Whether tax is payable under reverse charge - No</p>
  </div> */}
            <div className="text-center p-2 rounded">
              <p className="text-sm font-bold">For {soldBy.name}</p>
              <p className="text-xs font-medium text-gray-600 mt-1">
                DIGITAL INVOICE - SIGNATURE NOT REQUIRED
              </p>
              <p className="text-xs italic mt-1">
                This is a system generated document and does not require
                physical signature
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
