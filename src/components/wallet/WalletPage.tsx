import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WalletSummary = {
  totalCredits?: number;
  totalDebits?: number;
  totalCommissions?: number;
  totalPayments?: number;
};

type WalletHistoryItem = {
  id?: string | number;
  createdAt?: string;
  transactionType?: string; // e.g., ORDER_PAYMENT, COMMISSION, REFUND
  type?: string; // CREDIT | DEBIT
  amount?: number;
  description?: string;
  orderId?: string | number | null;
  referenceId?: string | number | null;
};

type HistoryResponse = {
  data?: WalletHistoryItem[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

const numberFmt = (n?: number) =>
  typeof n === "number" && !Number.isNaN(n) ? n.toLocaleString() : "0";

export default function WalletPage() {
  const role = (Cookies.get("user_role") || "").toLowerCase();
  const isAdmin = role === "admin";
  const token = Cookies.get(isAdmin ? "admin_token" : "vendor_token");
  const baseUrl = import.meta.env.VITE_BASE_UR as string;
  const basePath = isAdmin ? "admin" : "vendor";

  const [balance, setBalance] = useState<number | null>(null);
  const [summary, setSummary] = useState<WalletSummary>({});
  const [history, setHistory] = useState<WalletHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const fetchAll = async () => {
    if (!token) {
      setError("Missing auth token");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, historyRes, balanceRes] = await Promise.all([
        fetch(`${baseUrl}${basePath}/wallet/summary`, { headers }),
        fetch(`${baseUrl}${basePath}/wallet/history?page=${page}&limit=${limit}`, {
          headers,
        }),
        fetch(`${baseUrl}${basePath}/wallet/balance`, { headers }),
      ]);

      if (!summaryRes.ok) throw new Error("Failed to load summary");
      if (!historyRes.ok) throw new Error("Failed to load history");
      if (!balanceRes.ok) throw new Error("Failed to load balance");

      const summaryJson = (await summaryRes.json()) as unknown;
      const historyJson = (await historyRes.json()) as unknown;
  const balanceJson = (await balanceRes.json()) as unknown;

      // Parse summary: expected { data: { admin: {...}, wallet: { currentBalance, totalCredits, ... } } }
      const hasProp = (o: unknown, k: string): o is Record<string, unknown> =>
        typeof o === "object" && o !== null && k in (o as Record<string, unknown>);
      const isNumberLike = (v: unknown): v is number => typeof v === "number" && !Number.isNaN(v);
      const toNumber = (v: unknown): number => {
        if (isNumberLike(v)) return v as number;
        const n = typeof v === "string" ? Number(v) : Number(v as number);
        return Number.isNaN(n) ? 0 : n;
      };
      let nextSummary: WalletSummary = {};
      let balanceFromSummary: number | undefined;
      if (hasProp(summaryJson, "data")) {
        const data = summaryJson.data;
        if (hasProp(data, "wallet")) {
          const wallet = data.wallet as Record<string, unknown>;
          if (wallet && typeof wallet === "object") {
            nextSummary = {
              totalCredits: toNumber(wallet.totalCredits),
              totalDebits: toNumber(wallet.totalDebits),
              totalCommissions: toNumber(wallet.totalCommissions),
              totalPayments: toNumber(wallet.totalPayments),
            };
            const cb = wallet.currentBalance;
            const n = toNumber(cb);
            balanceFromSummary = isNumberLike(n) ? n : undefined;
          }
        }
      }
      setSummary(nextSummary);

      // Parse history: expected { data: { history: WalletHistoryItem[], pagination: {...} } }
      let parsedHistory: WalletHistoryItem[] = [];
      let parsedTotalPages = 1;
      if (hasProp(historyJson, "data")) {
        const hData = historyJson.data as Record<string, unknown>;
        const historyArr = Array.isArray(hData.history) ? (hData.history as unknown[]) : [];
        const pag = (hData.pagination as { totalPages?: number } | undefined) ?? undefined;
        parsedHistory = historyArr.map((hRow) => {
          const row = (hRow || {}) as Record<string, unknown>;
          const amountNum = toNumber(row.amount);
          const order = (row.order as Record<string, unknown>) || {};
          return {
            id: row.id as number | string | undefined,
            createdAt: row.createdAt as string | undefined,
            transactionType: row.transactionType as string | undefined,
            type: row.type as string | undefined,
            amount: amountNum,
            description: row.description as string | undefined,
            orderId: (row.orderId as number | string | undefined) ?? (order.id as number | string | undefined) ?? null,
            referenceId: (row.orderItemId as number | string | undefined) ?? null,
          };
        });
        const tp = pag?.totalPages ?? 1;
        parsedTotalPages = tp > 0 ? tp : 1;
      }
      setHistory(parsedHistory);
      setTotalPages(parsedTotalPages);

      // Balance can be either number, { data: number }, { data: { balance } }, or { balance }
      type WithData<T> = { data?: T };
      type WithBalance = { balance?: number };
      let bal: number | null = null;
      if (typeof balanceJson === "number") {
        bal = balanceJson;
      } else if (typeof balanceJson === "object" && balanceJson !== null) {
        const withData = balanceJson as WithData<unknown>;
        if (typeof withData.data === "number") {
          bal = withData.data;
        } else if (
          typeof withData.data === "object" && withData.data !== null
        ) {
          const inner = withData.data as WithBalance;
          if (typeof inner.balance === "number") {
            bal = inner.balance;
          }
        } else {
          const obj = balanceJson as WithBalance;
          if (typeof obj.balance === "number") {
            bal = obj.balance;
          }
        }
      }
      // Prefer balance from summary if available, else balance endpoint
      const chosen =
        typeof balanceFromSummary === "number" && !Number.isNaN(balanceFromSummary)
          ? balanceFromSummary
          : bal;
      setBalance(typeof chosen === "number" && !Number.isNaN(chosen) ? chosen : 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isAdmin]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ {numberFmt(balance ?? 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAdmin ? "Platform" : "Vendor"} wallet balance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ {numberFmt(summary.totalCredits)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ {numberFmt(summary.totalDebits)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ {numberFmt(summary.totalCommissions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ {numberFmt(summary.totalPayments)}</div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet History</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-600 text-sm mb-3">{error}</div>
          )}
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : history.length === 0 ? (
            <div className="text-sm text-muted-foreground">No transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Direction</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium">Ref/Order</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={`${h.id ?? h.createdAt}-${Math.random()}`} className="border-b last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {h.createdAt ? new Date(h.createdAt).toLocaleString() : "-"}
                      </td>
                      <td className="px-3 py-2">{h.transactionType || "-"}</td>
                      <td className={cn(
                        "px-3 py-2 font-medium",
                        h.type === "CREDIT" ? "text-green-600" : "text-red-600"
                      )}>
                        ₹ {numberFmt(h.amount)}
                      </td>
                      <td className="px-3 py-2">{h.type || "-"}</td>
                      <td className="px-3 py-2 max-w-[320px] truncate" title={h.description || ""}>
                        {h.description || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {h.orderId ?? h.referenceId ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
