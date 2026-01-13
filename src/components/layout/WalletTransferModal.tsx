'use client';

import { useState } from 'react';
import { X, Loader2, Send } from 'lucide-react';
import { walletService } from '@/services/wallet.service';
import { toast } from 'sonner';

interface WalletTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

export function WalletTransferModal({ isOpen, onClose, currentBalance }: WalletTransferModalProps) {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!recipientAddress.trim()) {
      toast.error('Please enter a recipient address');
      return;
    }

    if (recipientAddress.length < 32 || recipientAddress.length > 44) {
      toast.error('Recipient address must be 32-44 characters');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0.000001) {
      toast.error('Minimum transfer amount is 0.000001 SOL');
      return;
    }

    if (parsedAmount > currentBalance) {
      toast.error(`Insufficient balance. You have ${currentBalance.toFixed(6)} SOL`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await walletService.transferSOL(recipientAddress.trim(), parsedAmount);

      if (response.success) {
        toast.success('Transfer successful!');
        setRecipientAddress('');
        setAmount('');
        onClose();
      } else {
        toast.error(response.message || 'Transfer failed');
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast.error(error.response?.data?.message || 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">Transfer SOL</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Balance Info */}
          <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
            <div className="text-xs text-slate-400 mb-1">Current Balance</div>
            <div className="text-lg font-bold text-white">{currentBalance.toFixed(6)} SOL</div>
          </div>

          {/* Recipient Address */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              placeholder="Enter Solana wallet address (32-44 characters)"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
            />
            <div className="text-xs text-slate-400 mt-1">
              {recipientAddress.length}/44 characters
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
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
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setAmount(currentBalance.toString())}
                disabled={isLoading}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Max
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Transfer
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="px-6 pb-4 text-xs text-slate-400">
          <p>Minimum: 0.000001 SOL • Maximum: {currentBalance.toFixed(6)} SOL</p>
        </div>
      </div>
    </div>
  );
}
