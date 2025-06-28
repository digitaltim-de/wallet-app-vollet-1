"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { toast } from "sonner";

interface TransactionData {
  hash: string;
  blockNumber: string;
  timestamp: string;
  fromAddress: string;
  toAddress: string;
  valueDecimal: string;
  feeDecimal: string;
  status: string;
  tokenSymbol: string;
}

interface TransactionListProps {
  transactions: TransactionData[];
  walletAddress: string;
  isLoading: boolean;
  transactionTab: 'all' | 'incoming' | 'outgoing';
  onTabChange: (tab: 'all' | 'incoming' | 'outgoing') => void;
  currentPage: number;
  totalTransactions: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (perPage: number) => void;
}

export const TransactionList = ({
  transactions,
  walletAddress,
  isLoading,
  transactionTab,
  onTabChange,
  currentPage,
  totalTransactions,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}: TransactionListProps) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTransactionIcon = (transaction: TransactionData) => {
    const isIncoming = transaction.toAddress.toLowerCase() === walletAddress.toLowerCase();
    
    if (transaction.status === 'pending') {
      return { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    } else if (isIncoming) {
      return { icon: ArrowDownLeft, color: 'text-green-400', bg: 'bg-green-500/20' };
    } else {
      return { icon: ArrowUpRight, color: 'text-blue-400', bg: 'bg-blue-500/20' };
    }
  };

  const getTransactionType = (transaction: TransactionData) => {
    const isIncoming = transaction.toAddress.toLowerCase() === walletAddress.toLowerCase();
    return isIncoming ? 'Received' : 'Sent';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Hash copied to clipboard");
  };

  const totalPages = Math.ceil(totalTransactions / itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Transaction History</h2>
      </div>

      <div className="flex bg-white/10 backdrop-blur-lg rounded-xl p-1">
        <button
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            transactionTab === 'all' 
              ? 'bg-white/20 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => onTabChange('all')}
        >
          All
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            transactionTab === 'incoming' 
              ? 'bg-white/20 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => onTabChange('incoming')}
        >
          Incoming
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            transactionTab === 'outgoing' 
              ? 'bg-white/20 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => onTabChange('outgoing')}
        >
          Outgoing
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-400">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          Loading transactions...
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const { icon: Icon, color, bg } = getTransactionIcon(tx);
            const isIncoming = tx.toAddress.toLowerCase() === walletAddress.toLowerCase();
            const amount = parseFloat(tx.valueDecimal);
            
            return (
              <div
                key={tx.hash}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-white font-semibold text-sm">{getTransactionType(tx)}</h3>
                        <Badge 
                          className={`text-xs ${
                            tx.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          } border-0`}
                        >
                          {tx.status === 'confirmed' ? 'Succeeded' : 
                           tx.status === 'pending' ? 'Pending' : 'Failed'}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-xs">{formatDate(tx.timestamp)}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-gray-500 text-xs">
                          {isIncoming ? 'From' : 'To'}: {formatAddress(isIncoming ? tx.fromAddress : tx.toAddress)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(tx.hash);
                          }}
                          className="text-gray-500 hover:text-white p-1"
                        >
                          <Copy size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${isIncoming ? 'text-green-400' : 'text-red-400'}`}>
                      {isIncoming ? '+' : '-'}{amount.toFixed(6)} {tx.tokenSymbol}
                    </div>
                    <div className="text-gray-400 text-xs">
                      Fee: -{parseFloat(tx.feeDecimal).toFixed(6)} {tx.tokenSymbol}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowUpRight className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-white font-semibold mb-2">No transactions yet</h3>
          <p className="text-gray-400 text-sm">
            Your transaction history will appear here once you start using your wallet.
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-xl"
          >
            Previous
          </Button>
          <span className="text-gray-400 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-xl"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};