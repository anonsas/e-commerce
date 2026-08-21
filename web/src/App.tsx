import { useAuth } from "@clerk/react";
import { Routes, Route, Navigate } from "react-router";
import { Layout, PageLoader } from "@components";
import {
  HomePage,
  CartPage,
  AdminPage,
  OrdersPage,
  ProductPage,
  OrderChatPage,
  OrderSummaryPage,
  OrderDetailsPage,
  OrderVideoCallPage,
  CheckoutReturnPage,
} from "@pages";

export function App() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <PageLoader />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/orders" element={isSignedIn ? <OrdersPage /> : <Navigate to="/" replace />} />
        <Route path="/checkout/return" element={<CheckoutReturnPage />} />
        <Route
          path="/orders/:id/call"
          element={isSignedIn ? <OrderVideoCallPage /> : <Navigate to="/" replace />}
        />
        <Route path="/admin" element={isSignedIn ? <AdminPage /> : <Navigate to="/" replace />} />

        {/* NESTED ROUTES */}
        <Route path="/orders/:id" element={<OrderDetailsPage />}>
          <Route index element={<OrderSummaryPage />} />
          <Route path="chat" element={<OrderChatPage />} />
        </Route>
      </Routes>
    </Layout>
  );
}
