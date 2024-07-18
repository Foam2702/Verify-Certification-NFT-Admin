import React, { useState, useEffect } from "react";
import axios from "axios";
import useSigner from "../state/signer";
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useNavigate } from "react-router-dom";
import { hashImage, isExistsInPinata, encryptData, add0x, decryptData, remove0x, imageUpload, fetchImagePinata, addFileToIPFS, imageFileToBase64, base64ToImageFile } from "../helpers";
import { v4 as uuidv4 } from 'uuid'
import MultiActionAreaCard from "./MultiACtionAreaCard";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import "./BodySection.css";
import { ContactPageSharp, Margin } from "@mui/icons-material";
import Button from '@mui/material/Button';
const { ethers } = require("ethers");


const BodySection = () => {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [regions, setRegions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [organization, setOrganization] = useState([]);
  const [file, setFile] = useState(null);
  const { signer, address, connectWallet, contract, provider, getPublicKey } = useSigner();
  const [showAlert, setShowAlert] = useState(false);
  const [messageAlert, setMessageAlert] = useState("")
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(3)
  const [alertSeverity, setAlertSeverity] = useState("");
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState(null)
  const navigate = useNavigate();
  useEffect(() => {
    const fetchDataRegions = async () => {
      try {
        const result = await axios("https://verify-certification-nft-production.up.railway.app/tickets");
        if (Array.isArray(result.data.cities)) {
          setRegions(result.data.cities);
          console.log({ regions });
        } else {
          throw new Error("Unexpected data format");
        }
      }
      catch (err) {
        console.log(err)
      }

    };
    fetchDataRegions().catch((error) => console.error(error));
    const fetchDataCourses = async () => {
      try {
        const result = await axios("https://verify-certification-nft-production.up.railway.app/tickets");
        if (Array.isArray(result.data.certificates)) {
          setCourses(result.data.certificates);
          console.log(result.data.certificates);
        } else {
          throw new Error("Unexpected data format");
        }
      }
      catch (err) {
        console.log(err)
      }
    };
    fetchDataCourses().catch((error) => console.error(error));
  }, []);
  const onfileChange = async (event) => {
    setFile(event.target.files);
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      try {
        const base64ImageString = await imageFileToBase64(file);
        setImageUrl(base64ImageString);
      } catch (error) {
        console.error('Error converting file to base64', error);
      }
    }
  };
  const checkIssuer = async (licensing_authority) => {
    const { ethereum } = window;
    if (ethereum) {
      const result = await contract.getVerifiersByOrganizationCode(licensing_authority);
      return result
    }
  }

  const insertPubToDB = async () => {
    if (address) {
      try {
        const checkPublicKeyExisted = await axios.get(`https://verify-certification-nft-production.up.railway.app/addresses/${address}`);
        if (checkPublicKeyExisted.data.address.length === 0) {
          const publicKey = await getPublicKey(); // Await the result of getPublicKey
          if (publicKey.code === 4001 && publicKey.message === "User rejected the request.") {
            console.log('Error retrieving public key:', publicKey);
            setAlertSeverity("warning");
            setMessageAlert("You must sign to submit");
            setShowAlert(true);
            return false;
          }
          await axios.post(`https://verify-certification-nft-production.up.railway.app/addresses/${address}`, {
            address: address, // Include the address in the body
            publicKey: publicKey // Include the public key in the body
          });
          return true
        }
        else if (checkPublicKeyExisted.data.address.length !== 0) {
          if (checkPublicKeyExisted.data.address[0].publickey == null) {
            const publicKey = await getPublicKey(); // Await the result of getPublicKey
            if (publicKey.code === 4001 && publicKey.message === "User rejected the request.") {
              setAlertSeverity("warning");
              setMessageAlert("You must sign to submit");
              setShowAlert(true);
              return false
            }
            await axios.post(`https://verify-certification-nft-production.up.railway.app/addresses/${address}`, {
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
  const handleSubmit = async (privateKey, check) => {
    setLoading(true)
    if (check) {
      const form = document.querySelector("form");
      let image_res = ''
      let hashImg = ''
      const formData = new FormData();
      const emailPattern = /^[a-zA-Z0-9._%+-]+@(gmail\.com|student\.hcmus\.edu\.vn)$/;
      const data = Array.from(form.elements)
        .filter((input) => input.name)
        .reduce(
          (obj, input) => Object.assign(obj, { [input.name]: input.value }),
          {}
        );
      const fields = [
        'name', 'gender', 'email', 'citizenId', 'dob', 'region',
        'workUnit', 'certificateName', 'issueDate'
      ];
      for (const field of fields) {
        if (!data[field]) {
          setMessageAlert(`Please fill out the ${field} field.`);
          setAlertSeverity("warning");
          setShowAlert(true);
          setLoading(false);
          return;
        }
      }
      if (!emailPattern.test(data.email)) {
        setMessageAlert(`Invalid Mail`);
        setAlertSeverity("warning");
        setShowAlert(true);
        setLoading(false);
        document.querySelector("[name='email']").classList.add('invalid-input');
        return;
      } else {
        console.log("Valid email");
      }
      if (file && file.length > 0) {
        for (let i = 0; i < file.length; i++) {
          formData.append("imageCertificate", file[i]);
        }
        try {
          const ownerPublicKeysResponse = await axios.get(`https://verify-certification-nft-production.up.railway.app/addresses/${address}`)
          if (ownerPublicKeysResponse.data.address.length === 0) {
            setLoading(false);
            return;
          }
          const publicKeyOwner = ownerPublicKeysResponse.data.address[0].publickey
          const base64ImageString = await imageFileToBase64(formData.get("imageCertificate"));
          hashImg = hashImage(base64ImageString)
          const exists = await isExistsInPinata(hashImg)
          if (exists) {
            setLoading(false);
            setAlertSeverity("warning");
            setMessageAlert(`This certificate already belongs to someone else or you already get this certificate`);
            setShowAlert(true);
            return
          }
          const imageEncrypt = await encryptData(base64ImageString, privateKey, remove0x(publicKeyOwner));
          image_res = await imageUpload(imageEncrypt, hashImg, address, data["certificateName"])
          console.log("OWNER", publicKeyOwner)
          const issuers = await checkIssuer(data.licensingAuthority);
          const fieldsToEncrypt = [
            'citizenId', 'name', 'region', 'dob', 'gender', 'email',
            'workUnit', 'point', 'issueDate', 'expiryDate'];

          if (issuers.length === 0) {
            setLoading(false)
            setAlertSeverity("warning");
            setMessageAlert(`No issuer found for ${data.licensingAuthority}`);
            setShowAlert(true);
            return;
          }
          else {
            const id = uuidv4();
            for (const field of fieldsToEncrypt) {
              const encryptedData = data[field] ? await encryptData(data[field], privateKey, remove0x(publicKeyOwner)) : null;
              formData.append(field, JSON.stringify(encryptedData));
            }

            formData.append("issuerAddress", ' ')
            formData.append("cidCertificate", image_res)
            formData.append("id", id)
            formData.append("owner", address)
            formData.append("certificateName", data.certificateName)
            formData.append("licensingAuthority", data.licensingAuthority);
            // for (let pair of formData.entries()) {
            //   console.log(pair[0] + ", " + pair[1]);
            // }
            const response = await axios.post("https://verify-certification-nft-production.up.railway.app/tickets", formData);
            if (response.data.message === "ticket already exist") {
              setLoading(false);
              setAlertSeverity("warning");
              setMessageAlert("Ticket already exist");
              setShowAlert(true);
              return
            }
            for (const issuer of issuers) {
              const issuerPublicKeysResponse = await axios.get(`https://verify-certification-nft-production.up.railway.app/addresses/${issuer}`);
              if (issuerPublicKeysResponse.data.address.length === 0) {
                setLoading(false); // Stop loading regardless of the request outcome
                setAlertSeverity("warning");
                setMessageAlert(`${data.licensingAuthority} is busy. Please comeback later`);
                setShowAlert(true);
                return;
              }
              else if (issuerPublicKeysResponse.data.address[0].publickey != null) {
                const formData = new FormData();
                for (let i = 0; i < file.length; i++) {
                  formData.append("imageCertificate", file[i]);
                }
                const base64ImageString = await imageFileToBase64(formData.get("imageCertificate"));
                const imageEncrypt = await encryptData(base64ImageString, privateKey, remove0x(issuerPublicKeysResponse.data.address[0].publickey));
                const publicKeyIssuer = issuerPublicKeysResponse.data.address[0].publickey
                console.log("ISSUER", publicKeyIssuer)

                for (const field of fieldsToEncrypt) {
                  const encryptedData = data[field] ? await encryptData(data[field], privateKey, remove0x(publicKeyIssuer)) : null;
                  formData.append(field, JSON.stringify(encryptedData));
                }
                image_res = await imageUpload(imageEncrypt, hashImg, address, data["certificateName"])
                formData.append("issuerAddress", issuerPublicKeysResponse.data.address[0].address)
                formData.append("cidCertificate", image_res)
                formData.append("id", id)
                formData.append("owner", address)
                formData.append("certificateName", data.certificateName)
                formData.append("licensingAuthority", data.licensingAuthority);
                const response = await axios.post("https://verify-certification-nft-production.up.railway.app/tickets", formData);
                if (response.data.message === "ticket already exist") {
                  setLoading(false); // Stop loading regardless of the request outcome
                  setAlertSeverity("warning");
                  setMessageAlert("Ticket already exist");
                  setShowAlert(true);
                  return
                }
              }
            }
          }
          setLoading(false); // Stop loading regardless of the request outcome
          setAlertSeverity("success");
          setMessageAlert(`Submitted successfully. Please wait for confirmation from the ${data.licensingAuthority}`);
          setShowAlert(true);
        } catch (err) {
          console.log(err)
        }
      } else {
        setMessageAlert(`Please select image`);
        setAlertSeverity("warning");
        setShowAlert(true);
        setLoading(false); // Stop loading regardless of the request outcome
        return;
      }
    }
    else {
      setLoading(false)
      return
    }
  };

  const handleClose = async (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowAlert(false);
  };

  const handleCourseChange = (event) => {
    const selectedCourse = courses.find(
      (course) => course.certificate === event.target.value
    );
    setOrganization(selectedCourse ? selectedCourse.org : "");
  };

  const onCancelBtnClick = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    navigate("/")
  };
  function formatDate(input) {
    const datePart = input.match(/\d+/g);
    const year = datePart[0];
    const month = datePart[1];
    const day = datePart[2];

    return day + "/" + month + "/" + year;
  }
  const handleClickOpen = (e) => {
    e.preventDefault()
    setOpen(true)
  };

  const handleCloseDialog = () => setOpen(false);
  const handleSubmitPrivateKey = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const privateKey = formData.get('privatekey')
    try {
      const check = await insertPubToDB()
      if (check) {
        const privateKeyBytes = ethers.utils.arrayify(add0x(privateKey));
        const publicKeyFromPrivateKey = ethers.utils.computePublicKey(privateKeyBytes);
        const ownerPublicKeysResponse = await axios.get(`https://verify-certification-nft-production.up.railway.app/addresses/${address}`)

        if (ownerPublicKeysResponse.data.address.length === 0) {
          return;
        }
        const publicKeyOwner = ownerPublicKeysResponse.data.address[0].publickey
        if (publicKeyFromPrivateKey == publicKeyOwner) {
          handleSubmit(privateKey, check)
          setError(null); // Clear any previous errors
        }
        else {
          setAlertSeverity("error");
          setMessageAlert("Wrong private key");
          setShowAlert(true);
        }
      }
      else {
        return
      }

    } catch (err) {

      setAlertSeverity("error");
      setMessageAlert("Wrong private key");
      setShowAlert(true);
      console.log(err)
    }
  }
  return (
    <>
      {loading && (
        <div className="loading-overlay">
          <CircularProgress />
        </div>
      )}
      <Dialog
        open={open}
        onClose={handleCloseDialog}
        PaperProps={{
          component: 'form',
          onSubmit: handleSubmitPrivateKey
        }}
        maxWidth="md"
        sx={{
          '& .MuiDialogContent-root': { fontSize: '1.25rem' },
          '& .MuiTextField-root': { fontSize: '1.25rem' },
          '& .MuiButton-root': { fontSize: '1.25rem' },
        }}
      >
        <DialogTitle sx={{ fontSize: '1.5rem' }}>Private Key</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1.5rem' }}>
            Please enter private key from your MetaMask
          </DialogContentText>
          <div className="private-key-image-container">
            <img loading="lazy" className="private-key-image" src="/MetaMask_find_account_details_extension-6df8f1e43a432c53fdaa0353753b1ca8.gif" alt="MetaMask find account details extension"></img>
            <img loading="lazy" className="private-key-image" src="/MetaMask_find_export_account_private_key_extension_1-e67f48ba55b839654514e39e186400fb.gif" alt="MetaMask find account details extension"></img>

            <img loading="lazy" className="private-key-image" src="/MetaMask_find_export_account_private_key_extension_2-6c913141ad005ec35a3248944b1a25dd.gif" alt="MetaMask find account details extension"></img>

          </div>


          <TextField
            autoFocus
            required
            margin="normal"
            name="privatekey"
            label="Private Key"
            type="privatekey"
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiInputBase-input': { fontSize: '1.25rem' },
              '& .MuiInputLabel-root': { fontSize: '1.25rem' },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} type="submit">Enter</Button>
          <Button onClick={handleCloseDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
      <section className="body-section1">
        <div className="body-header">
          <h1 className="body-header-text2">Fill in your certificate information</h1>
        </div>
        <form
          className="careers-section"
          encType="multipart/form-data"
          action=""
        >
          <div className="careers-section-inner">
            <div className="name-parent">
              <div className="name">
                <h3 className="name1">Name *</h3>
                <input
                  className="input-name"
                  name="name"
                  placeholder="Type here..."
                  type="text"
                />
              </div>
              <div className="gender">
                <h3 className="gender1">Gender *</h3>
                <select className="input-gender" name="gender">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="email">
                <h3 className="email1">Email</h3>
                <input
                  className="input-email"
                  name="email"
                  placeholder="abc@abc.com"
                  type="email"
                />
              </div>
            </div>
          </div>
          <div className="careers-section-child">
            <div className="cccd-parent">
              <div className="cccd">
                <h3 className="cccd1">Citizen ID *</h3>
                <input
                  className="input-cccd"
                  name="citizenId"
                  placeholder="Type here..."
                  type="text"
                />
              </div>
              <div className="date-of-birth">
                <h3 className="date-of-birth1">Date of birth *</h3>
                <input
                  className="input-date-of-birth"
                  name="dob"
                  placeholder="Choose..."
                  type="date"
                />
              </div>
              <div className="home-town">
                <h3 className="home-town-text">Region *</h3>
                <select className="input-home-town" name="region">
                  <option value="">Select region ...</option>
                  {regions.map((region) => (
                    <option key={region._id} value={region.name}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="working-unit-parent">
            <div className="working-unit">
              <h3 className="working-unit-text">Work unit *</h3>
              <input
                className="input-working-unit"
                name="workUnit"
                placeholder="Type here..."
                type="text"
              />
            </div>
            <div className="name-of-vertification">
              <h3 className="name-of-vertification1">Certificate name *</h3>
              <select
                className="input-name-of-vertification"
                option={courses}
                name="certificateName"
                onChange={handleCourseChange}
              >
                <option value="">Select Certificate ...</option>
                {courses.map((course, index) => (
                  <option key={index} value={course.certificate}>
                    {course.certificate}
                  </option>
                ))}
              </select>
            </div>
            <div className="score">
              <h3 className="score-text">Point</h3>
              <input
                className="input-score"
                name="point"
                placeholder="Type here..."
                type="text"
              />
            </div>

            <div className="date-vertification">
              <h3 className="date-vertification-text">Issue Date *</h3>
              <input
                className="input-date-vertification"
                name="issueDate"
                placeholder="Choose..."
                type="date"
              />
            </div>
            <div className="expired-date">
              <h3 className="expired-date-text">Expiry Date </h3>
              <input
                className="input-expired-date"
                name="expiryDate"
                placeholder="Choose..."
                type="date"
              />
            </div>
            <div className="vertification-unit">
              <h3 className="vertification-unit-text">Licensing Authority *</h3>
              <input
                className="input-vertification-unit"
                name="licensingAuthority"
                type="text"
                disabled
                value={organization}
              />
            </div>
          </div>
          <div className="upload-wrapper">
            <div className="upload">
              <h3 className="upload-file-text">Image of certificate *</h3>
              <div className="input-upload-file">
                <div className="input-box-background" />
                {/* <div classname="input-image"> */}
                <input
                  className="example-here"
                  name="imageCertificate"
                  type="file"
                  accept=".jpg"
                  multiple
                  onChange={onfileChange}
                />
                <MultiActionAreaCard image={imageUrl} size={500} sx={{ Margin: 10 }} />

                {/* </div> */}
              </div>
            </div>
          </div>
          <div className="body-button">
            <button className="submit-button" onClick={handleClickOpen}>
              <div className="submit">Submit</div>
            </button>
            <button className="cancel-button" onClick={onCancelBtnClick}>
              <div className="cancel">Cancel</div>
            </button>
          </div>
        </form>
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
      </section>
    </>
  );
};

export default BodySection;

