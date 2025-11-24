import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Copy, QrCode, X } from 'lucide-react';
import { QRCodeCanvas } from "qrcode.react";
import axios from 'axios';
import { uploadDirectToCloudinary } from '../../utils/cloudinaryUpload';
import { API_URL } from '../../utils/config';

function PaymentForm({ onSubmit }) {
  const { user } = useAuth();
  const [paymentDetails, setPaymentDetails] = useState({
    upiNumber: '',
    upiId: '',
    accountHolder: ''
  });
  const [amount, setAmount] = useState('');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [screenshotInputKey, setScreenshotInputKey] = useState(Date.now());
  const [belongsTo, setBelongsTo] = useState('youth');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState({
    upiNumber: '',
    upiId: ''
  });
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchPaymentDetails();
  }, []);

  const fetchPaymentDetails = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/payment-details`);
      setPaymentDetails(data);
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      toast.error('Failed to fetch payment details');
    }
  };

  const handlePayNow = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setShowPaymentOptions(true);
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);

    // Update copied details state based on type
    if (type === 'UPI Number') {
      setCopiedDetails({ ...copiedDetails, upiNumber: text, upiId: '' });
    } else if (type === 'UPI ID') {
      setCopiedDetails({ ...copiedDetails, upiNumber: '', upiId: text });
    }
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      toast.error('File size should be less than 30MB');
      return;
    }

    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }
  
    setIsSubmitting(true);
    setUploadProgress(0);
  
    try {
      const uploaded = await uploadDirectToCloudinary({
        file: screenshot,
        folder: 'PaymentScreenshots',
        resourceType: 'image',
        onProgress: (p) => setUploadProgress(p),
      });
  
      const payload = {
        amount: Number(amount),
        belongsTo,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        registerId: user.registerId,
        screenshot: uploaded.url,
        screenshotPublicId: uploaded.publicId,
      };
  
      await onSubmit(payload);
  
      // Reset form for next payment
      setAmount('');
      setScreenshot(null);
      setScreenshotPreview(null);
      setScreenshotInputKey(Date.now()); 
      setShowPaymentOptions(false);
      setSelectedOption(null);
  
      toast.success(
        'Payment submitted successfully. We will verify and confirm payment in 4 hours. Thank you for your patience.',
        { duration: 5000 }
      );
    } catch (error) {
      toast.error('Failed to submit payment');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };  

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handlePayNow} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={user?.name || ''}
            disabled
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="tel"
            value={user?.phoneNumber || ''}
            disabled
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300" placeholder="Enter amount"
          />
        </div>

        {!showPaymentOptions && (
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Pay Now
          </button>
        )}
      </form>

      {showPaymentOptions && (
        <div className="mt-6 space-y-6">
          {(copiedDetails.upiNumber || copiedDetails.upiId) && (
            <div className="text-center space-y-2">
              {copiedDetails.upiNumber && (
                <p className="font-medium text-green-600">Copied UPI Number: {copiedDetails.upiNumber}</p>
              )}
              {copiedDetails.upiId && (
                <p className="font-medium text-green-600">Copied UPI ID: {copiedDetails.upiId}</p>
              )}
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setSelectedOption('number');
                handleCopy(paymentDetails.upiNumber, 'UPI Number');
              }}
              className={`px-4 py-2 rounded-md ${
                selectedOption === 'number'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Copy className="inline-block mr-2 h-4 w-4" />
              UPI Number
            </button>
            <button
              onClick={() => {
                setSelectedOption('id');
                handleCopy(paymentDetails.upiId, 'UPI ID');
              }}
              className={`px-4 py-2 rounded-md ${
                selectedOption === 'id'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Copy className="inline-block mr-2 h-4 w-4" />
              UPI ID
            </button>
            <button
              onClick={() => setSelectedOption('qr')}
              className={`px-4 py-2 rounded-md ${
                selectedOption === 'qr'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <QrCode className="inline-block mr-2 h-4 w-4" />
              QR Code
            </button>
          </div>

          <div className="text-center space-y-4">
            <p className="font-medium">Amount: ₹{amount}</p>
            <p className="text-sm text-gray-600">You&apos;re Paying to: {paymentDetails.accountHolder}</p>
          </div>

          {selectedOption === 'qr' && (
            <div className="flex justify-center">
              <QRCodeCanvas
                value={`upi://pay?pa=${paymentDetails.upiId}&pn=${encodeURIComponent(paymentDetails.accountHolder)}&am=${amount}&cu=INR`}
                size={200}
                level="H"
              />
            </div>
          )}

          <div className="space-y-4">
            <p className="text-center text-sm text-gray-600">
              Please make payment and upload the screenshot below
            </p>
            
            <div className="flex flex-col items-center space-y-4">
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700">Payment Screenshot *</label>
    <input
      key={screenshotInputKey}
      type="file"
      accept="image/*"
      onChange={handleScreenshotUpload}
      className="mt-1 block w-full text-sm text-gray-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-full file:border-0
        file:text-sm file:font-semibold
        file:bg-indigo-50 file:text-indigo-700
        hover:file:bg-indigo-100"
    />
  </div>

  {screenshotPreview && (
    <div className="mt-2 relative inline-block">
      <img
        src={screenshotPreview}
        alt="Screenshot Preview"
        className="h-20 w-20 object-cover border rounded"
      />
      <button
        type="button"
        onClick={() => {
          setScreenshot(null);
          setScreenshotPreview(null);
          setScreenshotInputKey(Date.now());
        }}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )}
</div>

            <button
  onClick={handleSubmit}
  className={`w-full flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 ${
    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  disabled={isSubmitting}
>
  {isSubmitting ? (
    <>
      Submitting...
      {uploadProgress > 0 && <span className="ml-2 text-sm text-white">{uploadProgress}%</span>}
    </>
  ) : (
    'Submit Payment'
  )}
</button>
            
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentForm;
