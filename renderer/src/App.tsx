import { useState } from "react";
import { ipcLink, trpc } from "../../utils/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./App.css";
import axios from "axios";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import HomeView from "./pages/home-page/home-view";
import AccountView from "./pages/account-manager/account-view";
import LogView from "./pages/log-view/log-view";
import ConfigView from "./pages/config-view/config-view";
import OrderListView from "./pages/order/order-list-view";

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => {
    return trpc.createClient({
      links: [ipcLink()],
    });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<HomeView />}>
              {/* <Route index element={<Dashboard />} /> */}
              <Route path="/account" element={<AccountView />} />
              <Route index element={<AccountView />} />
              <Route path="/log" element={<LogView />} />
              <Route path="/config" element={<ConfigView />} />
              <Route path="/order-list" element={<OrderListView />} />
              <Route path="/log" element={<LogView />} />
            </Route>
          </Routes>
        </Router>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
