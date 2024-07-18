import HeaderSection from "../components/HeaderSection";
import HelpSection from "../components/HelpSection";
import FeauresSection from "../components/FeauresSection";
import Footer from "../components/Footer";
import HomeSection from "../components/HomeSection";
import "./LoginNew.css";
import { motion } from "framer-motion";

const LoginNew = () => {
  return (
    <motion.div
      exit={{ opacity: 0, y: -50 }}
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="loginnew"
    >
      <HeaderSection />
      <section className="body-section">
        <HomeSection />

        <div className="body-header-1">
          <h1 className="body-header-text">
            Over 2000 certificates authenticated at VSCourses
          </h1>
          <div className="body-header-text1">
            SBTs are non-transferable tokens linked directly to your identity, ensuring certificates cannot be forged.
          </div>
        </div>
        <HelpSection />
        <FeauresSection />
      </section>
      <Footer
        shapeLeft="/shape-left@2x.png"
        socialIcontwitter="/socialicontwitter@2x.png"
      />
    </motion.div>
  );
};

export default LoginNew;
