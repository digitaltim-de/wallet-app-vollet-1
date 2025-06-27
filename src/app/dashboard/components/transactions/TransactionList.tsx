"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface TransactionData {
  hash: string;
  blockNumber: string;
  timestamp: string; // ISO date format
  fromAddress: string;
  toAddress: string;
  valueDecimal: string;
  feeDecimal: string;
  status: string; // "confirmed", "pending", "failed"
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
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format time for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Transactions</h2>

        <div className="flex mb-4 border-b border-[#2a2a2a]">
          <Button
            variant="ghost"
            className={`pb-2 px-4 rounded-none ${transactionTab === 'all' ? 'text-[#a99fec] border-b-2 border-[#a99fec]' : 'text-gray-400'}`}
            onClick={() => onTabChange('all')}
          >
            All
          </Button>
          <Button
            variant="ghost"
            className={`pb-2 px-4 rounded-none ${transactionTab === 'incoming' ? 'text-[#a99fec] border-b-2 border-[#a99fec]' : 'text-gray-400'}`}
            onClick={() => onTabChange('incoming')}
          >
            Incoming
          </Button>
          <Button
            variant="ghost"
            className={`pb-2 px-4 rounded-none ${transactionTab === 'outgoing' ? 'text-[#a99fec] border-b-2 border-[#a99fec]' : 'text-gray-400'}`}
            onClick={() => onTabChange('outgoing')}
          >
            Outgoing
          </Button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-gray-400">Loading transactions...</div>
        ) : transactions.length > 0 ? (
          <>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <Card key={tx.hash} className="bg-[#2a2a2a] border-[#3a3a3a]">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div>
                        <div className="flex items-center mb-2">
                          <Badge 
                            className={`
                              ${tx.status === 'confirmed' ? 'bg-green-900/20 text-green-500' : 
                                tx.status === 'pending' ? 'bg-yellow-900/20 text-yellow-500' : 
                                'bg-red-900/20 text-red-500'} 
                              border-0 mr-2
                            `}
                          >
                            {tx.status}
                          </Badge>
                          <Badge 
                            className={`
                              ${tx.toAddress && tx.toAddress.toLowerCase() === walletAddress.toLowerCase() ? 
                                'bg-green-900/20 text-green-500' : 
                                'bg-red-900/20 text-red-500'} 
                              border-0
                            `}
                          >
                            {tx.toAddress && tx.toAddress.toLowerCase() === walletAddress.toLowerCase() ? 'Received' : 'Sent'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400 mb-1">
                          {formatTime(tx.timestamp)}
                        </div>
                        <div className="text-sm text-gray-400 flex flex-wrap gap-2">
                          <span>
                            From: {formatAddress(tx.fromAddress)}
                            <button
                              className="ml-1 text-gray-400 hover:text-[#a99fec]"
                              onClick={() => {
                                copyToClipboard(tx.fromAddress);
                                toast("Address copied", {
                                  description: "From address copied to clipboard"
                                });
                              }}
                            >
                              <Copy size={12}/>
                            </button>
                          </span>
                          <span>
                            To: {tx.toAddress ? formatAddress(tx.toAddress) : 'N/A'}
                            {tx.toAddress && (
                              <button
                                className="ml-1 text-gray-400 hover:text-[#a99fec]"
                                onClick={() => {
                                  copyToClipboard(tx.toAddress);
                                  toast("Address copied", {
                                    description: "To address copied to clipboard"
                                  });
                                }}
                              >
                                <Copy size={12}/>
                              </button>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 md:mt-0 text-right">
                        <div className="font-bold text-white">
                          {tx.valueDecimal} {tx.tokenSymbol}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Fee: {tx.feeDecimal}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center justify-end">
                          <span className="truncate max-w-[120px]">{tx.hash}</span>
                          <button
                            className="ml-1 text-gray-400 hover:text-[#a99fec]"
                            onClick={() => {
                              copyToClipboard(tx.hash);
                              toast("Hash copied", {
                                description: "Transaction hash copied to clipboard"
                              });
                            }}
                          >
                            <Copy size={12}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalTransactions)} of {totalTransactions} transactions
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white hover:bg-[#3a3a3a]"
                  >
                    Previous
                  </Button>
                  <div className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white hover:bg-[#3a3a3a]"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-gray-400">No transactions found</div>
        )}
      </div>
    </div>
  );
};
