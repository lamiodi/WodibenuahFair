import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import toast, { Toaster } from 'react-hot-toast';
import PaystackPop from '@paystack/inline-js';
import { apiRequest } from '../services/api';
import SEO from '../components/SEO';

const CompletePayment = () => {
    const [email, setEmail] = useState('');
    const [vendorData, setVendorData] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, checking, found, paying, verifying, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const [boothPrices, setBoothPrices] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch prices to calculate appropriate payment amount
        const fetchPrices = async () => {
            try {
                const prices = await apiRequest('/vendors/prices');
                setBoothPrices(prices);
            } catch (error) {
                console.error('Error fetching prices:', error);
            }
        };
        fetchPrices();
    }, []);

    const handleLookup = async (e) => {
        e.preventDefault();
        setStatus('checking');
        setErrorMessage('');
        setVendorData(null);

        try {
            const { vendor } = await apiRequest('/vendors/lookup', {
                method: 'POST',
                body: { email }
            });

            setVendorData(vendor);
            setStatus('found');
        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorMessage(err.message || 'Error looking up registration.');
            toast.error(err.message || 'Error looking up registration.');
        }
    };

    const calculateAmount = () => {
        if (!vendorData) return 0;

        // Check if there are location-specific prices
        const locationPrices = boothPrices[vendorData.selected_location] || boothPrices['Default'] || boothPrices;
        return locationPrices[vendorData.booth_type] || 190000;
    };

    const handlePayment = () => {
        if (!vendorData) return;

        setStatus('paying');
        const amountToCharge = calculateAmount() * 100; // Paystack expects amount in kobo

        const paystack = new PaystackPop();
        paystack.newTransaction({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
            email: vendorData.email,
            amount: amountToCharge,
            metadata: {
                vendorId: vendorData.id,
                custom_fields: [
                    { display_name: "Booth Type", variable_name: "booth_type", value: vendorData.booth_type },
                    { display_name: "Location", variable_name: "location", value: vendorData.selected_location }
                ]
            },
            onSuccess: (transaction) => {
                setStatus('verifying');
                // Verify payment on backend
                apiRequest('/vendors/verify-payment', {
                    method: 'POST',
                    body: {
                        reference: transaction.reference,
                        vendorId: vendorData.id
                    }
                })
                    .then(data => {
                        if (data.status === 'success') {
                            toast.success('Payment successful!');
                            setStatus('success');
                            navigate(`/thank-you?reference=${transaction.reference}&location=${encodeURIComponent(vendorData.selected_location || 'your location')}`);
                        } else {
                            const msg = data.message || 'Payment verification failed.';
                            toast.error(msg);
                            setErrorMessage(msg);
                            setStatus('error');
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        const msg = err.message || 'Error verifying payment.';
                        toast.error(msg);
                        setErrorMessage(msg);
                        setStatus('error');
                    });
            },
            onCancel: () => {
                setStatus('found');
                setErrorMessage('Transaction cancelled. Please try again when you are ready.');
                toast.error('Transaction cancelled');
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#F5F5F0] text-deep-black font-body">
            <SEO
                title="Complete Payment"
                description="Complete your pending Wodibenuah Fair vendor payment securely."
                url="/complete-payment"
                noindex
            />
            <Toaster position="top-center" reverseOrder={false} />
            <Navigation />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="bg-white p-8 md:p-12 border border-black max-w-2xl mx-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tighter uppercase mb-6 text-center">
                        Complete Payment
                    </h1>

                    <p className="text-gray-600 mb-8 text-center text-sm">
                        Already registered but haven&apos;t paid yet? Enter the email address you used to register to continue to payment and secure your booth.
                    </p>

                    <form onSubmit={handleLookup} className="mb-8">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your registered email"
                                required
                                className="flex-grow bg-[#F5F5F0] px-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-gold"
                                disabled={status === 'checking'}
                            />
                            <button
                                type="submit"
                                disabled={status === 'checking'}
                                className="bg-black text-white px-8 py-3 font-bold uppercase tracking-wider hover:bg-gold hover:text-black transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                                {status === 'checking' ? 'Searching...' : 'Find Details'}
                            </button>
                        </div>
                    </form>

                    {errorMessage && (
                        <div className="bg-red-50 text-red-600 p-4 border border-red-200 mb-8 text-sm">
                            {errorMessage}
                        </div>
                    )}

                    {vendorData && (
                        <div className="bg-[#F5F5F0] p-6 border border-black">
                            <h2 className="text-xl font-heading font-bold uppercase mb-4 border-b border-gray-300 pb-2">
                                Registration Found
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Business Name</p>
                                    <p className="font-medium text-lg">{vendorData.business_name}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Location</p>
                                        <p className="font-medium">{vendorData.selected_location}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Booth Type</p>
                                        <p className="font-medium">{vendorData.booth_type}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Payment Status</p>
                                    <p className={`font-bold uppercase ${vendorData.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                                        {vendorData.payment_status}
                                    </p>
                                </div>
                            </div>

                            {vendorData.payment_status === 'paid' ? (
                                <div className="bg-green-50 border border-green-200 p-4 text-center">
                                    <p className="text-green-800 font-bold mb-2">You have already completed your payment!</p>
                                    <p className="text-sm text-green-700">Thank you for securing your booth.</p>
                                </div>
                            ) : (
                                <div className="border-t border-gray-300 pt-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="font-bold uppercase tracking-wider">Amount Due:</span>
                                        <span className="text-3xl font-black font-mono">₦{calculateAmount().toLocaleString()}</span>
                                    </div>

                                    <button
                                        onClick={handlePayment}
                                        disabled={status === 'paying' || status === 'verifying'}
                                        className="w-full bg-gold text-black px-8 py-4 font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all transform hover:-translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:hover:-translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg"
                                    >
                                        {status === 'paying' ? 'Opening Paystack...' :
                                            status === 'verifying' ? 'Verifying Payment...' :
                                                `Pay ₦${calculateAmount().toLocaleString()} Now`}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CompletePayment;
