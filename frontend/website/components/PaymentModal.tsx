'use client';

import React, { useState } from 'react';
import { X, CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentDetails {
    endpoint: string;
    pricePerRequest: number;
    currency: string;
    acceptedTokens: string[];
    paymentAddress: string;
    creditBalance?: number;
}

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentDetails: PaymentDetails;
    onPaymentComplete: () => void;
}

export default function PaymentModal({
    isOpen,
    onClose,
    paymentDetails,
    onPaymentComplete
}: PaymentModalProps) {
    const [selectedToken, setSelectedToken] = useState(paymentDetails.acceptedTokens[0] || 'MNEE');
    const [amount, setAmount] = useState(10); // Default 10 MNEE = 100 credits
    const [transactionHash, setTransactionHash] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    const creditsToReceive = amount * 10; // 1 MNEE = 10 credits
    const estimatedCalls = Math.floor(creditsToReceive / paymentDetails.pricePerRequest);

    const handlePayment = async () => {
        if (!transactionHash.trim()) {
            setErrorMessage('Please enter a transaction hash');
            return;
        }

        setIsProcessing(true);
        setPaymentStatus('processing');
        setErrorMessage('');

        try {
            const response = await fetch('/api/payments/buy-credits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    transactionHash: transactionHash.trim(),
                    amount,
                    token: selectedToken
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Payment failed');
            }

            const data = await response.json();
            setPaymentStatus('success');

            // Wait a moment to show success, then close and retry original request
            setTimeout(() => {
                onPaymentComplete();
                onClose();
            }, 2000);
        } catch (error: any) {
            setPaymentStatus('error');
            setErrorMessage(error.message || 'Payment processing failed');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isProcessing}
                >
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <CreditCard className="text-blue-600" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Payment Required</h2>
                    </div>
                    <p className="text-gray-600 text-sm">
                        This premium feature requires payment to access
                    </p>
                </div>

                {/* Endpoint Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Endpoint</span>
                        <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                            {paymentDetails.endpoint}
                        </code>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Price per request</span>
                        <span className="text-sm font-semibold text-gray-900">
                            {paymentDetails.pricePerRequest} credits
                        </span>
                    </div>
                    {paymentDetails.creditBalance !== undefined && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Current balance</span>
                            <span className="text-sm font-semibold text-blue-600">
                                {paymentDetails.creditBalance} credits
                            </span>
                        </div>
                    )}
                </div>

                {paymentStatus === 'success' ? (
                    /* Success State */
                    <div className="text-center py-8">
                        <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                        <p className="text-gray-600">
                            {creditsToReceive} credits added to your account
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Token Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Token
                            </label>
                            <select
                                value={selectedToken}
                                onChange={(e) => setSelectedToken(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isProcessing}
                            >
                                {paymentDetails.acceptedTokens.map(token => (
                                    <option key={token} value={token}>{token}</option>
                                ))}
                            </select>
                        </div>

                        {/* Amount Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount ({selectedToken})
                            </label>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isProcessing}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                You'll receive {creditsToReceive} credits (~{estimatedCalls} API calls)
                            </p>
                        </div>

                        {/* Transaction Hash Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Transaction Hash
                            </label>
                            <input
                                type="text"
                                placeholder="0x..."
                                value={transactionHash}
                                onChange={(e) => setTransactionHash(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                disabled={isProcessing}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Send {amount} {selectedToken} to {paymentDetails.paymentAddress.slice(0, 10)}...
                            </p>
                        </div>

                        {/* Error Message */}
                        {paymentStatus === 'error' && errorMessage && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                                <p className="text-sm text-red-700">{errorMessage}</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={isProcessing || !transactionHash.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Processing...
                                    </>
                                ) : (
                                    'Confirm Payment'
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* Help Text */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        Credits never expire and can be used across all premium features
                    </p>
                </div>
            </div>
        </div>
    );
}
