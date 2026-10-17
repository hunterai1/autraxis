import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import Lenis from "lenis";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { ContentProvider } from "@/content/ContentContext";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import Solutions from "@/pages/Solutions";
import About from "@/pages/About";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Insights from "@/pages/Insights";
import InsightDetail from "@/pages/InsightDetail";
import Contact from "@/pages/Contact";
import Careers from "@/pages/Careers";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import NotFound from "@/pages/NotFound";
import AdminLayout from "@/admin/AdminLayout";
import AdminLogin from "@/admin/Login";
import AdminForgot from "@/admin/Forgot";
import AdminReset from "@/admin/Reset";
import Dashboard from "@/admin/Dashboard";
import Submissions from "@/admin/Submissions";
import ContentHome from "@/admin/ContentHome";
import SingletonEditor from "@/admin/SingletonEditor";
import CollectionManager from "@/admin/CollectionManager";
import Users from "@/admin/Users";
import Audit from "@/admin/Audit";
import Monitoring from "@/admin/Monitoring";
import AdminSettings from "@/admin/Settings";
import AdminSecurity from "@/admin/Security";

const ScrollManager = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PageviewTracker = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});
  }, [pathname]);
  return null;
};

const SingletonRoute = () => {
  const { key } = useParams();
  return <SingletonEditor contentKey={key} />;
};

const CollectionRoute = () => {
  const { name } = useParams();
  return <CollectionManager name={name} />;
};

const PublicSite = () => (
  <>
    <a href="#main-content" className="skip-link" data-testid="skip-to-content-link">
      Skip to main content
    </a>
    <PageviewTracker />
    <Header />
    <main id="main-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/insights/:slug" element={<InsightDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer />
  </>
);

function App() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <ContentProvider>
          <ScrollManager />
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot" element={<AdminForgot />} />
            <Route path="/admin/reset" element={<AdminReset />} />
            <Route path="/admin/inbox" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="inquiries" element={<Submissions kind="inquiries" />} />
              <Route path="applications" element={<Submissions kind="applications" />} />
              <Route path="content" element={<ContentHome />} />
              <Route path="content/:key" element={<SingletonRoute />} />
              <Route path="collection/:name" element={<CollectionRoute />} />
              <Route path="users" element={<Users />} />
              <Route path="audit" element={<Audit />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="security" element={<AdminSecurity />} />
            </Route>
            <Route path="/*" element={<PublicSite />} />
          </Routes>
          <Toaster position="bottom-right" theme="dark" />
        </ContentProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
