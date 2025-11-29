import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Map from "./pages/Map.jsx";
import Care from "./pages/Care.jsx";
import FeedPage from "./pages/FeedPage";
import PostDetail from "./pages/PostDetail";
import Report from "./pages/Report.jsx";
import Login from "./pages/Login.jsx";
import Layout from "./pages/Layout.jsx"; // 我們下面會建這個共用框架

export const router = createBrowserRouter([
  {
    element: <Layout />, // 有導覽列的共用外框
    children: [
      { path: "/", element: <Home /> },
      { path: "/map", element: <Map /> },
      { path: "/care", element: <Care /> },
      { path: "/feed", element: <FeedPage /> },
      { path: "post/:id", element: <PostDetail /> },
      { path: "/report", element: <Report /> },
      { path: "/login", element: <Login /> },
    ],
  },
]);
