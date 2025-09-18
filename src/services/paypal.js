import axios from 'axios';

// Base URL of your backend server that handles PayPal orders
const BACKEND_BASE_URL = 'https://your-backend.example.com';

// Create a PayPal order by calling your backend API
export const createPayPalOrder = async (subscriptionTier) => {
  try {
    const response = await axios.post(`${BACKEND_BASE_URL}/create-paypal-order`, {
      tier: subscriptionTier,
    });
    return response.data; // Should include orderID and approval URL or token
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to create PayPal order');
  }
};

// Capture a PayPal order after user approval (notify backend)
export const capturePayPalOrder = async (orderId) => {
  try {
    const response = await axios.post(`${BACKEND_BASE_URL}/capture-paypal-order`, {
      orderId,
    });
    return response.data; // Contains capture details and status
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to capture PayPal order');
  }
};
