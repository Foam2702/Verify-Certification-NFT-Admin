import "./HelpSection.css";
import { useNavigate } from "react-router-dom";
import * as React from 'react';
import { useEffect, useState } from "react";
import axios from 'axios'
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import useSigner from "../state/signer";
const HelpSection = () => {
  const [loading, setLoading] = useState(false)
  const [showAlert, setShowAlert] = useState(false);
  const [messageAlert, setMessageAlert] = useState("")
  const [alertSeverity, setAlertSeverity] = useState("");

  const { signer, address, connectWallet, getPublicKey } = useSigner()
  const navigate = useNavigate();

  const handleVerification = async () => {
    setLoading(true); // Start loading
    const checkPub = await insertPubToDB()
    if (!address) {
      navigate("/");
    }
    else if (!checkPub) {
      setAlertSeverity("warning");
      setMessageAlert("You must sign ");
      setShowAlert(true);
      navigate("/");
    }
    else {
      navigate("/verification");
    }
    setLoading(false);

  }
  const handleBuyCourses = async () => {
    setLoading(true); // Start loading
    const checkPub = await insertPubToDB()
    if (!address) {
      navigate("/");
    }
    else if (!checkPub) {
      setAlertSeverity("warning");
      setMessageAlert("You must sign ");
      setShowAlert(true);
      navigate("/");

    }
    else {
      navigate("/coursetransfernew");
    }
    setLoading(false);

  }
  const handleUploadExam = async () => {
    setLoading(true); // Start loading
    const checkPub = await insertPubToDB()
    if (!address) {
      navigate("/");
    }
    else if (!checkPub) {
      setAlertSeverity("warning");
      setMessageAlert("You must sign ");
      setShowAlert(true);
      navigate("/");
    } else if (checkPub && address) {
      navigate("/uploadexam");
    }
    setLoading(false);

  }
  const handleClose = async (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowAlert(false);
  };

  const insertPubToDB = async () => {
    if (address) {
      try {
        const checkPublicKeyExisted = await axios.get(`http://localhost:8080/addresses/${address}`);
        if (checkPublicKeyExisted.data.address.length === 0) {
          const publicKey = await getPublicKey(); // Await the result of getPublicKey
          if (publicKey.code === 4001 && publicKey.message === "User rejected the request.") {
            return false
          }
          await axios.post(`http://localhost:8080/addresses/${address}`, {
            address: address, // Include the address in the body
            publicKey: publicKey // Include the public key in the body
          });
          return true
        }
        else if (checkPublicKeyExisted.data.address.length !== 0) {
          if (checkPublicKeyExisted.data.address[0].publickey == null) {
            const publicKey = await getPublicKey(); // Await the result of getPublicKey
            if (publicKey.code === 4001 && publicKey.message === "User rejected the request.") {

              return false
            }
            await axios.post(`http://localhost:8080/addresses/${address}`, {
              address: address, // Include the address in the body
              publicKey: publicKey // Include the public key in the body
            });

            return true
          }
        }
        return true
      }
      catch (err) {
        console.log(err)
        return false
      }
    }
  };
  return (
    <>
      {loading && (
        <div className="loading-overlay">
          <CircularProgress />
        </div>
      )}
      <div className="help-section">
        <div className="link-to-pages">
          <div className="link-to-vertification-page">
            <button onClick={handleVerification} >
              <img
                className="vertification-image-icon"
                loading="lazy"
                alt=""
                src="/vertification-image@2x.png"
              />
            </button>
            <h3 className="vertification-text">Certificate Verification
            </h3>
            <div className="describe-text">{`Fast and accurate certificate verification using Soulbound Token technology.`}</div>
            <div className="learn-more-parent">
              <button className="learn-more" onClick={handleVerification} >Learn More</button>
              <button className="icon-wrapper" >
                <img className="icon" loading="lazy" alt="" src="/icon@2x.png" />
              </button>
            </div>
          </div>
          <button className="link-to-upload-to-course" onClick={handleUploadExam}>
            <img
              className="upload-to-upload-image"
              loading="lazy"
              alt=""
              src="/upload-to-upload-image@2x.png"
            />
            <h3 className="upload-to-course">Post Exam</h3>
            <div className="describe-text1">{`Allow organizations and individuals to easily post certificate exams.`}</div>

            <div className="learn-more-group">
              <button className="learn-more1" onClick={handleUploadExam}>Learn More</button>
              <div className="icon-container">
                <img className="icon1" alt="" src="/icon-1@2x.png" />
              </div>
            </div>
          </button>
          <button className="link-to-buy-course" onClick={handleBuyCourses}>
            <img
              className="buy-course-image"
              loading="lazy"
              alt=""
              src="/buy-course-image@2x.png"
            />
            <h3 className="buy-course">Certificate Examination</h3>
            <div className="describe-text2">{`Provide a secure and convenient online examination platform.`}</div>
            <div className="learn-more-container">
              <button className="learn-more2" onClick={handleBuyCourses}>Learn More</button>
              <div className="icon-frame">
                <img className="icon2" alt="" src="/icon@2x.png" />
              </div>
            </div>
          </button>
        </div>

      </div>
      <Snackbar open={showAlert} autoHideDuration={10000} onClose={handleClose}>
        <Alert
          onClose={handleClose}
          severity={alertSeverity}
          variant="filled"
          sx={{
            width: '100%',
            fontSize: '1.25rem', // Increase font size
          }}
        >
          {messageAlert}
        </Alert>
      </Snackbar>
    </>
  );
};

export default HelpSection;
