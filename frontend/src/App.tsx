import { Outlet } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";

export function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <Header />
      <div className="flex">
        <Sidebar />
        <main id="main-content" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
