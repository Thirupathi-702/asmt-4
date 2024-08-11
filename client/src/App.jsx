import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './App.css'; 

// Register the necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const App = () => {
  const [buyerQty, setBuyerQty] = useState('');
  const [buyerPrice, setBuyerPrice] = useState('');
  const [sellerQty, setSellerQty] = useState('');
  const [sellerPrice, setSellerPrice] = useState('');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);

  useEffect(() => {
    fetchPendingOrders();
    fetchCompletedOrders();
  }, []);

  const fetchPendingOrders = async () => {
    const response = await axios.get('http://localhost:3000/pending-orders');
    setPendingOrders(response.data);
  };

  const fetchCompletedOrders = async () => {
    const response = await axios.get('http://localhost:3000/completed-orders');
    setCompletedOrders(response.data);
  };

  const handleNewOrder = async () => {
    const newOrder = {
      BuyerQty: parseInt(buyerQty),
      BuyerPrice: parseFloat(buyerPrice),
      SellerPrice: parseFloat(sellerPrice),
      SellerQty: parseInt(sellerQty),
    };

    try {
      const response = await axios.post('http://localhost:3000/new-order', newOrder);
      fetchPendingOrders();
      fetchCompletedOrders();
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  const chartData = {
    labels: completedOrders.map((order, index) => `Order ${index + 1}`),
    datasets: [
      {
        label: 'Price',
        data: completedOrders.map(order => order.price),
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
      },
    ],
  };

  return (
    <div className="container">
      <h1>Order Matching System</h1>
      <div className="input-container">
        <input
          type="number"
          placeholder="Buyer Qty"
          value={buyerQty}
          onChange={e => setBuyerQty(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Buyer Price"
          value={buyerPrice}
          onChange={e => setBuyerPrice(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Seller Price"
          value={sellerPrice}
          onChange={e => setSellerPrice(e.target.value)}
        />
        <input
          type="number"
          placeholder="Seller Qty"
          value={sellerQty}
          onChange={e => setSellerQty(e.target.value)}
        />
        <button onClick={handleNewOrder}>Place Order</button>
      </div>
      <div className="table-container">
        <h2>Pending Orders</h2>
        <table>
          <thead>
            <tr>
              <th>Buyer Qty</th>
              <th>Buyer Price</th>
              <th>Seller Price</th>
              <th>Seller Qty</th>
            </tr>
          </thead>
          <tbody>
            {pendingOrders.length > 0 ? (
              pendingOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.buyerqty}</td>
                  <td>{order.buyerprice}</td>
                  <td>{order.sellerprice}</td>
                  <td>{order.sellerqty}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-data">No pending orders available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-container">
        <h2>Completed Orders</h2>
        <table>
          <thead>
            <tr>
              <th>Price</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {completedOrders.length > 0 ? (
              completedOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.price}</td>
                  <td>{order.qty}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="no-data">No completed orders available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="chart-container">
        <h2>Price Chart</h2>
        <Line data={chartData} />
      </div>
    </div>
  );
};

export default App;
