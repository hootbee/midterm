import React from 'react';
import { Line } from 'react-chartjs-2';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const BidHistoryChart = ({ bids }) => {
  // Filter bids for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const filteredBids = bids.filter(bid => new Date(bid.timestamp) >= thirtyDaysAgo);

  const chartData = {
    labels: filteredBids.map(bid => new Date(bid.timestamp).toLocaleString()),
    datasets: [
      {
        label: '입찰가',
        data: filteredBids.map(bid => bid.amount),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '최근 30일 입찰 내역',
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default BidHistoryChart;
