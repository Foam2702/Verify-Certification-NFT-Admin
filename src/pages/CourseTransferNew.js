// import HeaderSection from "../components/HeaderSection2";
import BodyCourses from "../components/BodyCourses";
import Footer from "../components/Footer";
import HeaderSection from "../components/HeaderSection";
import CourseSection from "../components/CourseSection"
import React, { useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom';
import useSigner from "../state/signer";
import "./CourseTransferNew.css";

const CourseTransferNew = () => {
  const adminAddress = process.env.REACT_APP_ADMIN;
  const navigate = useNavigate()
  const { signer, address, connectWallet, contract, provider, getPublicKey } = useSigner();
  useEffect(() => {
    if (address) {
      if (address === adminAddress) {
        navigate("/");
        // Assuming contract is an object that should have destroy method
        if (contract && typeof contract.destroy === 'function') {
          contract.destroy();
        } else {
          console.error('Contract does not have a destroy method', contract);
        }
      }
      else {
        navigate("/coursetransfernew");

      }
    }
    else if (!address) {
      navigate("/");

    }
  }, [address, signer]);



  return (
    <div className="coursetransfernew">
      <div className="header-section">
        <HeaderSection />
      </div>
      <CourseSection />

      <BodyCourses />
      <Footer
        shapeLeft="/shape-left@2x.png"
        socialIcontwitter="/socialicontwitter@2x.png"
      />    </div>
  );
};

export default CourseTransferNew;
