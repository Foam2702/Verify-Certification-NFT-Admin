import HeaderSection from "../components/HeaderSection";
import BodySection from "../components/BodySection";
import Footer from "../components/Footer";
import VerifySection from "../components/VerifySection";
import "./VertificationNew.css";
import { motion } from "framer-motion";
import React from 'react'
import { useNavigate } from "react-router-dom";
import useSigner from "../state/signer";

const VertificationNew = () => {
  const { signer, address, connectWallet, contract, provider, getPublicKey } = useSigner();
  const navigate = useNavigate();
  const adminAddress = process.env.REACT_APP_ADMIN;

  React.useEffect(() => {
    const checkIssuer = async () => {
      if (address) {
        try {
          const { ethereum } = window;
          if (ethereum) {
            const result = await contract.getOrganizationCode(address);
            if (result.length !== 0 || address == adminAddress) {
              navigate("/");
            }
          }
        } catch (err) {
          console.log(err);
        }
      }
    };
    checkIssuer();
  }, [address, signer]);
  return (
    <motion.div
      className="vertificationnew"
      exit={{ opacity: 0, y: -50 }}
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <HeaderSection />
      <VerifySection />
      <BodySection />
      <Footer
        shapeLeft="/shape-left1.svg"
        socialIcontwitter="/socialicontwitter1.svg"
        footerDebugCommit="unset"
        footerMarginTop="unset"
      />
    </motion.div>
  );
};

export default VertificationNew;
