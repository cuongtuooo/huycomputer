import { Outlet } from "react-router-dom";
import AppHeader from "./components/layout/app.header";
import { useState } from "react";
import GeminiChat from "./components/chat/GeminiChat";
import AppFooter from "./components/layout/app.footer";

function Layout() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  return (
    <div>
      <AppHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <Outlet context={[searchTerm, setSearchTerm]} />
      <GeminiChat />
      <AppFooter />
    </div>
  )
}

export default Layout;
