"use client";

import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  ArrowLeft,
} from "lucide-react";
import { walletService } from "@/services/wallet.service";
import { toast } from "sonner";

export type ViewType = "selection" | "deposit" | "withdraw";

interface WalletTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  initialView?: ViewType;
}

export function WalletTransferModal({
  isOpen,
  onClose,
  currentBalance,
  initialView = "selection",
}: WalletTransferModalProps) {
  const [view, setView] = useState<ViewType>(initialView);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync view with initialView when modal opens
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
    }
  }, [isOpen, initialView]);

  // Fetch user's wallet address when deposit view is shown
  useEffect(() => {
    if (view === "deposit" && !userAddress) {
      fetchUserAddress();
    }
  }, [view]);

  const fetchUserAddress = async () => {
    setIsLoadingAddress(true);
    try {
      const response = await walletService.getWalletBalance();
      if (response.success && response.data?.walletAddress) {
        setUserAddress(response.data.walletAddress);
      } else if (response.walletAddress) {
        setUserAddress(response.walletAddress);
      }
    } catch (error) {
      console.error("Failed to fetch wallet address:", error);
      toast.error("Failed to load wallet address");
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(userAddress);
      setCopied(true);
      toast.success("Address copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!recipientAddress.trim()) {
      toast.error("Please enter a recipient address");
      return;
    }

    if (recipientAddress.length < 32 || recipientAddress.length > 44) {
      toast.error("Recipient address must be 32-44 characters");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0.000001) {
      toast.error("Minimum transfer amount is 0.000001 SOL");
      return;
    }

    if (parsedAmount > currentBalance) {
      toast.error(
        `Insufficient balance. You have ${currentBalance.toFixed(6)} SOL`,
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await walletService.transferSOL(
        recipientAddress.trim(),
        parsedAmount,
      );

      if (response.success) {
        toast.success("Transfer successful!");
        setRecipientAddress("");
        setAmount("");
        handleClose();
      } else {
        toast.error(response.message || "Transfer failed");
      }
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast.error(error.response?.data?.message || "Transfer failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setView("selection");
    setRecipientAddress("");
    setAmount("");
    setCopied(false);
    onClose();
  };

  const handleBack = () => {
    setView("selection");
    setRecipientAddress("");
    setAmount("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-white/10 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {view !== "selection" && (
              <button
                onClick={handleBack}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-bold text-white">
              {view === "selection" && "Wallet"}
              {view === "deposit" && "Deposit SOL"}
              {view === "withdraw" && "Withdraw SOL"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-400 cursor-pointer hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Selection View - Two Cards */}
          {view === "selection" && (
            <div className="space-y-4">
              {/* Balance Info */}
              <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                <div className="text-xs text-zinc-400 mb-1">
                  Current Balance
                </div>
                <div className="text-2xl font-bold text-white">
                  {currentBalance.toFixed(6)} SOL
                </div>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Deposit Card */}
                <button
                  onClick={() => setView("deposit")}
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl hover:border-emerald-500/40 hover:bg-emerald-500/15 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:bg-emerald-500/30 transition-colors">
                    <ArrowDownLeft className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-white font-medium">Deposit</span>
                  <span className="text-xs text-zinc-400 mt-1">
                    Receive SOL
                  </span>
                </button>

                {/* Withdraw Card */}
                <button
                  onClick={() => setView("withdraw")}
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl hover:border-blue-500/40 hover:bg-blue-500/15 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3 group-hover:bg-blue-500/30 transition-colors">
                    <ArrowUpRight className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-white font-medium">Withdraw</span>
                  <span className="text-xs text-zinc-400 mt-1">Send SOL</span>
                </button>
              </div>
            </div>
          )}

          {/* Deposit View - QR Code */}
          {view === "deposit" && (
            <div className="flex flex-col items-center space-y-6">
              {isLoadingAddress ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                </div>
              ) : userAddress ? (
                <>
                  {/* QR Code with Logo */}
                  <div className="relative bg-black  p-4 rounded-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(userAddress)}`}
                      alt="Wallet QR Code"
                      width={180}
                      height={180}
                      className="rounded"
                    />
                    {/* Playa Logo Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black p-1 rounded-lg shadow-sm">
                        <img
                          src="/playa-mainlogo1.png"
                          alt="Playa"
                          width={36}
                          height={36}
                          className="rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Display */}
                  <div className="w-full">
                    <label className="block text-xs text-zinc-400 mb-2 text-center">
                      Your Wallet Address
                    </label>
                    <div className="flex items-center gap-2 bg-zinc-800/50 border border-white/10 rounded-lg p-3">
                      <span className="flex-1 text-sm text-zinc-300 font-mono truncate">
                        {userAddress}
                      </span>
                      <button
                        onClick={copyToClipboard}
                        className="flex-shrink-0 p-2 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                        title="Copy address"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-zinc-400 hover:text-white" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <p className="text-xs text-zinc-500 text-center">
                    Send SOL to this address to deposit funds into your wallet
                  </p>
                </>
              ) : (
                <div className="text-center py-8 text-zinc-400">
                  Failed to load wallet address. Please try again.
                </div>
              )}
            </div>
          )}

          {/* Withdraw View - Transfer Form */}
          {view === "withdraw" && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              {/* Balance Info */}
              <div className="bg-zinc-800/50 rounded-lg p-3 mb-4">
                <div className="text-xs text-zinc-400 mb-1">
                  Available Balance
                </div>
                <div className="text-lg font-bold text-white">
                  {currentBalance.toFixed(6)} SOL
                </div>
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  placeholder="Enter Solana wallet address"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 bg-zinc-800/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
                />
                <div className="text-xs text-zinc-400 mt-1">
                  {recipientAddress.length}/44 characters
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Amount (SOL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="0.000001"
                    step="0.000001"
                    min="0.000001"
                    max={currentBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isLoading}
                    className="flex-1 px-3 py-2.5 bg-zinc-800/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(currentBalance.toString())}
                    disabled={isLoading}
                    className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 cursor-pointer bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-800 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Withdraw
                  </>
                )}
              </button>

              {/* Footer Info */}
              <div className="text-xs text-zinc-400 text-center pt-2">
                Minimum: 0.000001 SOL • Maximum: {currentBalance.toFixed(6)} SOL
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
