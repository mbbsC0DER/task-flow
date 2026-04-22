import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/today" element={<Index />} />
          <Route path="/weekly" element={<Index />} />
          <Route path="/total" element={<Index />} />
          <Route path="/meetings" element={<Index />} />
          <Route path="/approvals" element={<Index />} />
          <Route path="/analytics" element={<Index />} />
          <Route path="/users" element={<Index />} />
          <Route path="/settings" element={<Index />} />
          <Route path="/member/:id" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
