import React, { lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ClientDashboard from "@/pages/client-dashboard";
import ProviderDashboard from "@/pages/provider-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminBookings from "@/pages/admin-bookings";
import AdminPayments from "@/pages/admin/payments";
import AdminCashPayments from "@/pages/admin/cash-payments";
import AdminEarnings from "@/pages/admin/earnings";
import AdminWithdrawalRequests from "@/pages/admin/withdrawal-requests";
import ProviderProfile from "@/pages/provider-profile";
import ProviderServiceFlow from "@/pages/provider-service-flow";
import ProviderPayments from "@/pages/provider-payments";
import ProviderBookings from "@/pages/provider-bookings";
import ProviderBookingDetails from "@/pages/provider-bookings-details";
import ProviderBookingsOngoing from "@/pages/provider-bookings-ongoing";
import ProviderCashPayments from "@/pages/provider-cash-payments";
import ProviderWithdrawalRequests from "@/pages/provider-withdrawal-requests";
import ProviderWallet from "@/pages/provider-wallet";
import ProviderWalletEnhanced from "@/pages/provider-wallet-enhanced";
import ProviderPaymentMethods from "@/pages/provider-payment-methods";
import ProviderPromotionalBanners from "@/pages/provider-promotional-banners";
import ProviderAllServices from "@/pages/provider-all-services";
import ProviderPackages from "@/pages/provider-packages";
import ProviderAddOns from "@/pages/provider-add-ons";
import ServiceManagement from "@/pages/service-management";
import EmployeeManagement from "@/pages/employee-management";
import MediaManagement from "@/pages/media-management";
import AdminSettings from "@/pages/admin-settings";
import UploadTest from "@/pages/upload-test";
import AdvancedUploadDemo from "@/pages/advanced-upload-demo";
import TestProfile from "@/pages/test-profile";
import Profile from "@/pages/profile";
import Services from "@/pages/services";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import OrderDetails from "@/pages/order-details";
import OrderSuccess from "@/pages/order-success";
import ClientBookingDetails from "@/pages/client-booking-details";
import ClientReservas from "@/pages/client-reservas";
import ClientOffers from "@/pages/client-offers";
import ProviderChat from "@/pages/provider-chat";
import ClientChat from "@/pages/client-chat";
import AdminChat from "@/pages/admin-chat";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/client-dashboard" component={ClientDashboard} />
          <Route path="/client-reservas" component={ClientReservas} />
          <Route path="/client-booking-details/:id" component={ClientBookingDetails} />
          <Route path="/client-offers" component={ClientOffers} />
          <Route path="/client-chat" component={ClientChat} />
          <Route path="/provider-dashboard" component={ProviderDashboard} />
          <Route path="/provider-services" component={ProviderServiceFlow} />
          <Route path="/provider-payments" component={ProviderPayments} />
          <Route path="/provider-bookings" component={ProviderBookings} />
          <Route path="/provider-bookings/details/:id" component={ProviderBookingDetails} />
          <Route path="/provider-bookings/pending" component={ProviderBookings} />
          <Route path="/provider-bookings/accepted" component={ProviderBookings} />
          <Route path="/provider-bookings/ongoing" component={ProviderBookingsOngoing} />
          <Route path="/provider-bookings/completed" component={ProviderBookings} />
          <Route path="/provider-bookings/cancelled" component={ProviderBookings} />
          <Route path="/provider-cash-payments" component={ProviderCashPayments} />
          <Route path="/provider-withdrawal-requests" component={ProviderWithdrawalRequests} />
          <Route path="/provider-wallet" component={ProviderWalletEnhanced} />
          <Route path="/provider-payment-methods" component={ProviderPaymentMethods} />
          <Route path="/provider-promotional-banners" component={ProviderPromotionalBanners} />
          <Route path="/provider-all-services" component={ProviderAllServices} />
          <Route path="/provider-packages" component={ProviderPackages} />
          <Route path="/provider-add-ons" component={ProviderAddOns} />
          <Route path="/provider-chat" component={ProviderChat} />
          <Route path="/admin-dashboard" component={AdminDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin-bookings" component={AdminBookings} />
          <Route path="/admin-settings" component={AdminSettings} />
          <Route path="/admin-payments" component={AdminPayments} />
          <Route path="/admin-cash-payments" component={AdminCashPayments} />
          <Route path="/admin-earnings" component={AdminEarnings} />
          <Route path="/admin-withdrawal-requests" component={AdminWithdrawalRequests} />
          <Route path="/admin-chat/:conversationId" component={AdminChat} />
          <Route path="/service-management" component={ServiceManagement} />
          <Route path="/employee-management" component={EmployeeManagement} />
          <Route path="/media-management" component={MediaManagement} />
          <Route path="/upload-test" component={UploadTest} />
          <Route path="/advanced-upload" component={AdvancedUploadDemo} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/:id" component={ProviderProfile} />
          <Route path="/services" component={Services} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/orders" component={Orders} />
          <Route path="/orders/:id" component={OrderDetails} />
          <Route path="/order-success/:id" component={OrderSuccess} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
