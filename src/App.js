import { useEffect } from "react";
import {
  Routes,
  Route,
  useNavigationType,
  useLocation,

} from "react-router-dom";
import React from "react"
import LoginNew from "./pages/LoginNew";
import VertificationNew from "./pages/VertificationNew";
import VerificationForIssuer from "./pages/VerificationForIssuer";
import Exam from "./pages/Exam";
import CourseTransferNew from "./pages/CourseTransferNew";
import CourseInforNew from "./pages/CourseInforNew";
import { SignerProvider } from "./state/signer";
import LisenceView from "./pages/LisenceView";
import useSigner from "./state/signer";
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { Profile } from "./pages/Profile";
import UploadExam from "./pages/UploadExam";
import MetaMaskRequired from "./components/MetaMaskRequired";
import Share from "./pages/Share";
function App() {
  const action = useNavigationType();
  const location = useLocation();
  const pathname = location.pathname;
  const { loading, address } = useSigner();

  const navigate = useNavigate();

  useEffect(() => {
    if (action !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [action, pathname]);
  // useEffect(() => {
  //   if (address === null) {
  //     navigate("/");
  //   }
  // }, [address, navigate]);
  useEffect(() => {
    let title = "";
    let metaDescription = "";

    switch (pathname) {

      case "/":
        title = "Admin Dashboard";
        break;

      default:
        title = "VSCourses";
        break;
    }

    if (title) {
      document.title = title;
    }

    if (metaDescription) {
      const metaDescriptionTag = document.querySelector(
        'head > meta[name="description"]'
      );
      if (metaDescriptionTag) {
        metaDescriptionTag.content = metaDescription;
      }
    }
  }, [pathname]);

  return (
    <AnimatePresence wait>
      <SignerProvider>
        {loading && (
          <div className="loading-overlay">
            <CircularProgress />
          </div>
        )}

        <Routes>
          <Route path="/" element={<LoginNew />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />

        </Routes>
      </SignerProvider>
    </AnimatePresence>
  );
}
export default App;
