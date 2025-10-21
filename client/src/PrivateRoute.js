import React from 'react';
import { Navigate } from 'react-router-dom';

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  let isAdmin = false;

  if (token) {
    const decoded = decodeToken(token);
    if (decoded) {
      isAdmin = decoded.admin;
    }
  }

  return isAdmin ? children : <Navigate to="/" />;
};

export default PrivateRoute;
