import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { LocationProvider } from "@/contexts/LocationContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ClientDashboard from "@/pages/client-dashboard";
import ProviderDashboard from "@/pages/provider-dashboard";
import AdminDashboard from "@/pages/admin-dashboard-modern";
import AdminDashboardEnhanced from "@/pages/admin-dashboard-enhanced";
import AdminBookings from "@/pages/admin-bookings";
import AdminPayments from "@/pages/admin/payments";
import AdminCashPayments from "@/pages/admin/cash-payments";
import AdminEarnings from "@/pages/admin/earnings";
import AdminWithdrawalRequests from "@/pages/admin/withdrawal-requests";
import AdminProviders from "@/pages/admin-providers";
import AdminUsers from "@/pages/admin-users";
import AdminCategories from "@/pages/admin-categories";
import AdminMedia from "@/pages/admin-media";
import AdminChat from "@/pages/admin-chat";
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
import AdminPaymentMethods from "@/pages/admin-payment-methods";
import AdminServices from "@/pages/admin/services";
import UploadTest from "@/pages/upload-test";
import AdvancedUploadDemo from "@/pages/advanced-upload-demo";
import TestProfile from "@/pages/test-profile";
import Profile from "@/pages/profile";
import Services from "@/pages/services";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import CheckoutStep1 from "@/pages/checkout-step1";
import CheckoutStep2 from "@/pages/checkout-step2";
import CheckoutStep3 from "@/pages/checkout-step3";
import OrderSuccess from "@/pages/order-success";
import Orders from "@/pages/orders";
import OrderDetails from "@/pages/order-details";
import ClientBookingDetails from "@/pages/client-booking-details";
import ClientReservas from "@/pages/client-reservas";
import ClientOffers from "@/pages/client-offers";
import ClientOrders from "@/pages/client-orders";
import ClientOrderDetails from "@/pages/client-order-details";
import ProviderChat from "@/pages/provider-chat";
import ClientChat from "@/pages/client-chat";
import ProviderRegister from "@/pages/provider-register";
import MeusServicos from "@/pages/meus-servicos";
import TestMercadoPago from "@/pages/test-mercadopago";
import TestMercadoPagoSimple from "@/pages/test-mercadopago-simple";
import LayoutDemo from "@/pages/admin/layout-demo";

import Header from "@/components/layout/header";

function Router() {
  return (
    <Switch>
      {/* Admin Routes - Without Header/Footer */}
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin" component={AdminDashboardEnhanced} />
      <Route path="/admin-enhanced" component={AdminDashboardEnhanced} />
      <Route path="/admin-bookings" component={AdminBookings} />
      <Route path="/admin-settings" component={AdminSettings} />
      <Route path="/admin-payments" component={AdminPayments} />
      <Route path="/admin-cash-payments" component={AdminCashPayments} />
      <Route path="/admin-earnings" component={AdminEarnings} />
      <Route path="/admin-withdrawal-requests" component={AdminWithdrawalRequests} />
      <Route path="/admin-payment-methods" component={AdminPaymentMethods} />
      <Route path="/admin-providers" component={AdminProviders} />
      <Route path="/admin-users" component={AdminUsers} />
      <Route path="/admin-services" component={AdminServices} />
      <Route path="/admin-categories" component={AdminCategories} />
      <Route path="/admin-media" component={AdminMedia} />
      <Route path="/admin-chat" component={AdminChat} />
      <Route path="/admin-layout-demo" component={LayoutDemo} />

      {/* Provider Routes - Without Header/Footer */}
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
      <Route path="/meus-servicos" component={MeusServicos} />
      <Route path="/provider-chat" component={ProviderChat} />
      <Route path="/employee-management" component={EmployeeManagement} />

      {/* Regular Routes - With Header/Footer */}
      <Route>
        {(params) => (
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/login" component={Login} />
                <Route path="/register" component={Register} />
                <Route path="/provider-register" component={ProviderRegister} />
                <Route path="/client-dashboard" component={ClientDashboard} />
                <Route path="/client-reservas" component={ClientReservas} />
                <Route path="/client-booking-details/:id" component={ClientBookingDetails} />
                <Route path="/client-offers" component={ClientOffers} />
                <Route path="/client-orders" component={ClientOrders} />
                <Route path="/client-order-details/:id" component={ClientOrderDetails} />
                <Route path="/client-chat" component={ClientChat} />
                <Route path="/service-management" component={ServiceManagement} />
                <Route path="/media-management" component={MediaManagement} />
                <Route path="/upload-test" component={UploadTest} />
                <Route path="/advanced-upload" component={AdvancedUploadDemo} />
                <Route path="/profile" component={Profile} />
                <Route path="/profile/:id" component={ProviderProfile} />
                <Route path="/services" component={Services} />
                <Route path="/cart" component={Cart} />
                <Route path="/checkout" component={Checkout} />
                <Route path="/checkout/scheduling" component={CheckoutStep1} />
                <Route path="/checkout/payment" component={CheckoutStep2} />
                <Route path="/checkout/confirmation" component={CheckoutStep3} />
                <Route path="/order-success" component={OrderSuccess} />
                <Route path="/orders" component={Orders} />
                <Route path="/orders/:id" component={OrderDetails} />
                <Route path="/order-success/:id" component={OrderSuccess} />
                <Route path="/test-mercadopago" component={TestMercadoPago} />
                <Route path="/test-mercadopago-simple" component={TestMercadoPagoSimple} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <LocationProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </LocationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
