import "./LisenceView.css";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AlertTicket from "../components/AlertTicket"
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HeaderSection from "../components/HeaderSection";
import LisenceSection from '../components/LisenceSection';
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useSigner from "../state/signer";
import MultiActionAreaCard from "../components/MultiACtionAreaCard";
import { replaceBaseUrl } from '../helpers/index'
import Link from '@mui/material/Link';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import VerifiedIcon from '@mui/icons-material/Verified';
import CircularProgress from '@mui/material/CircularProgress';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { formatDateV2, minifyAddress, add0x, extractPinataCID, extractCID, remove0x, pinJSONToIPFS, extractEncryptedDataFromJson, decryptData } from "../helpers/index"
import { Remove } from "@mui/icons-material";
import { FaSearch } from 'react-icons/fa';
import LinkIcon from '@mui/icons-material/Link';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Share from "../pages/Share"
import Web3 from 'web3';
const { ethers } = require("ethers");
const SOULBOUND_ADDRESS = process.env.REACT_APP_SOULBOUND_ADDRESS;

const LisenceView = () => {
  const { signer, address, connectWallet, contract, getPublicKey } = useSigner()
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [open, setOpen] = useState(false);
  const [decryptedCertificates, setDecryptedCertificates] = useState([]);
  const [filterDecryptedCertificates, setFilterDecryptedCertificates] = useState([])
  const [showAlert, setShowAlert] = useState(false);
  const [messageAlert, setMessageAlert] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPrivateKeyValid, setIsPrivateKeyValid] = useState(false);
  const [input, setInput] = useState("")
  const [error, setError] = useState(null)
  const [share, setShare] = useState(false)
  const navigate = useNavigate();
  const [shareCertificate, setShareCertificate] = useState([])
  const [expandedCertificateIndex, setExpandedCertificateIndex] = useState(null); // Track which certificate is expanded
  const web3 = new Web3(window.ethereum);

  useEffect(() => {
    const getNFTs = async () => {
      if (address) {
        setLoading(true)
        try {
          const { data } = await axios(`https://testnets-api.opensea.io/api/v2/chain/sepolia/account/${address}/nfts`, options);
          console.log(data.nfts)
          data.nfts.map(async nft => {
            const tokenId = nft.identifier
            const logs = await web3.eth.getPastLogs({
              address: SOULBOUND_ADDRESS,
              topics: [
                web3.utils.sha3('Transfer(address,address,uint256)'),
                null,  // Any sender
                null,  // Any receiver
                web3.utils.padLeft(web3.utils.numberToHex(tokenId), 64)  // Token ID
              ],
              fromBlock: 0,
              toBlock: 'latest'
            });

            // Get unique transaction hashes from logs
            const transactionHashes = logs.map(log => log.transactionHash);
            const uniqueTransactionHashes = [...new Set(transactionHashes)];
            nft.transaction_hash = uniqueTransactionHashes[0]
            const transaction_receipt = await web3.eth.getTransactionReceipt(nft.transaction_hash);
            nft.from = transaction_receipt.from
          })
          console.log(data.nfts)
          setCertificates(data.nfts);
          setFilteredCertificates(data.nfts)

        } catch (err) {
          console.error(err);
        }
        setLoading(false)

      }
    };
    getNFTs();
  }, [address]);
  useEffect(() => {
    getShareCertificate()
  }, [address, isPrivateKeyValid])

  const getShareCertificate = async () => {
    if (address && isPrivateKeyValid) {
      setLoading(true);
      try {
        const results = await axios(`https://verify-certification-nft-production.up.railway.app/share?address=${address}`);
        console.log("RES", results);
        if (Array.isArray(results.data.data)) {
          setShareCertificate(results.data.data);
        } else {
          console.error('Fetched share data is not an array', results.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };
  const options = { method: 'GET', headers: { accept: 'application/json' } };
  const attributeLabels = {
    citizen_id: "Citizen ID",
    owner_address: "Owner Address",
    dob: "Date of Birth",
    licensing_authority: "Licensing Authority",
    gender: "Gender",
    email: "Email",
    work_unit: "Work Unit",
    issue_date: "Issue Date",
    expiry_date: "Expiry Date",
    region: "Region",
    status: "Status",
    expire_date: "Expiry Date",
    name: "Name",
    point: "Point"
  };
  const handleClickOpen = () => setOpen(true);
  const handleCloseDialog = () => setOpen(false);
  const handleClose = () => setShowAlert(false);
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
  const handleSubmitPrivateKey = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const privateKey = formData.get('privatekey');
    console.log(privateKey)
    // setPrivateKey(formData.get('privatekey'));
    setLoading(true); // Set loading to true when the user submits the private key
    try {
      const check = await insertPubToDB();
      if (check) {
        const privateKeyBytes = ethers.utils.arrayify(add0x(privateKey));
        const publicKeyFromPrivateKey = ethers.utils.computePublicKey(privateKeyBytes);
        const ownerPublicKeysResponse = await axios.get(`https://verify-certification-nft-production.up.railway.app/addresses/${address}`);

        if (ownerPublicKeysResponse.data.address.length === 0) {
          setIsPrivateKeyValid(false); // Set isPrivateKeyValid to false if no address is found
          return;
        }
        const publicKeyOwner = ownerPublicKeysResponse.data.address[0].publickey;
        if (publicKeyFromPrivateKey === publicKeyOwner) {
          setAlertSeverity("success");
          setMessageAlert("Correct private key");
          setShowAlert(true);
          setError(null); // Clear any previous errors
          setIsPrivateKeyValid(true); // Set isPrivateKeyValid to true if keys match
          await decryptAllFields(privateKey)
          setLoading(false)
        } else {
          setAlertSeverity("error");
          setMessageAlert("Wrong private key");
          setShowAlert(true);
          setIsPrivateKeyValid(false);
          setLoading(false)// Set isPrivateKeyValid to false if keys do not match
        }
      } else {
        setIsPrivateKeyValid(false);
        setLoading(false)// Consider setting isPrivateKeyValid to false if check fails
        return;
      }
    } catch (err) {
      setAlertSeverity("error");
      setMessageAlert("Wrong private key");
      setShowAlert(true);
      setIsPrivateKeyValid(false);
      setLoading(false)// Set isPrivateKeyValid to false on error
      console.log(err);
    }
  }

  const handleDecryptTicket = async (prop, privateKey, publicKeyOwner) => {
    if (prop != null && prop != '' && prop != undefined) {
      try {
        const parseProp = extractEncryptedDataFromJson(prop)

        const result = await decryptData(parseProp.cipher, parseProp.iv, remove0x(publicKeyOwner), privateKey);
        if (!result) throw new Error("Wrong private key");
        return result;
      } catch (error) {
        handleDecryptionError(error);
        return minifyAddress(prop.toString());
      }
    }
    else {
      // handleDecryptionError(error);

      return " "; // Return the original prop value in case of error
    }
  };

  const handleDecryptImage = async (cid, privateKey, publicKeyOwner) => {

    try {
      const { data } = await axios(`https://coral-able-takin-320.mypinata.cloud/ipfs/${cid}`);

      const parseImg = extractEncryptedDataFromJson(JSON.stringify(data.image))
      const decryptedData = await decryptData(parseImg.cipher, parseImg.iv, remove0x(publicKeyOwner), privateKey);
      if (!decryptedData) throw new Error("Wrong private key");
      return decryptedData;
    } catch (error) {
      // handleDecryptionError(error);
      return null;
    }
  };

  const handleDecryptionError = (error) => {
    const errorMessage = error.message.includes("Cipher key could not be derived")
      ? "Wrong private key"
      : "Error decrypting data";
    setAlertSeverity("error");
    setMessageAlert(errorMessage);
    setShowAlert(true);
    setIsPrivateKeyValid(false);
  };
  const handleExpandClick = (index) => {
    setExpandedCertificateIndex(expandedCertificateIndex === index ? null : index);
  };


  // useEffect(() => {
  const decryptAllFields = async (privateKey) => {

    try {
      const newDecryptedCertificates = [];
      const ownerPublicKeysResponse = await axios.get(`https://verify-certification-nft-production.up.railway.app/addresses/${address}`)
      if (ownerPublicKeysResponse.data.address.length === 0) {
        return;
      }
      const publicKeyOwner = ownerPublicKeysResponse.data.address[0].publickey

      for (const certificate of certificates) {
        const nfts = await axios(`https://coral-able-takin-320.mypinata.cloud/ipfs/${extractCID(certificate.metadata_url)}`)
        const name = nfts.data.name
        const opensea_url = certificate.opensea_url
        const id = certificate.identifier
        const image = await handleDecryptImage(extractPinataCID(nfts.data.image), privateKey, publicKeyOwner);
        const decryptedAttributes = await Promise.all(nfts.data.attributes.map(async (attribute) => {
          // if (attribute.value.startsWith('"') && attribute.value.endsWith('"')) {

          //   attribute.value = await handleDecryptTicket(attribute.value, privateKey, publicKeyOwner);
          // }
          if (attribute.trait_type != "status" && attribute.trait_type != "licensing_authority") {
            attribute.value = await handleDecryptTicket(attribute.value, privateKey, publicKeyOwner);

          }
          return attribute;
        }));
        newDecryptedCertificates.push({
          ...certificate,
          id,
          name,
          image_url: image,
          opensea_url,
          date: formatDateV2(certificate.updated_at),
          attributes: decryptedAttributes,
        });
      }
      setDecryptedCertificates(newDecryptedCertificates);
      setFilterDecryptedCertificates(newDecryptedCertificates)
      setIsPrivateKeyValid(true);
    } catch (error) {
      setIsPrivateKeyValid(false);
    }
    finally {
      setLoading(false); // Set loading to false after decryption process
    }
  };

  //   if (privateKey && certificates.length > 0) decryptAllFields();
  // }, [privateKey, certificates]);

  const handleChange = (value) => {
    setInput(value);
    const filterCertificates = certificates.filter((cer) =>
      cer.description.toLowerCase().includes(value.toLowerCase())
    );
    const filterDecryptedCertificates = decryptedCertificates.filter((dec_cer) =>
      dec_cer.description.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredCertificates(filterCertificates);
    setFilterDecryptedCertificates(filterDecryptedCertificates)
    console.log(filterDecryptedCertificates)
  };
  const handleShareChange = async (event, currentCertificate) => {
    event.preventDefault()
    console.log(currentCertificate)
    const shareCerti = {
      certificate_image: currentCertificate.image_url,
      certificate_name: currentCertificate.description,
      name: currentCertificate.attributes.find(item => item.trait_type === "name").value,
      issue_date: currentCertificate.attributes.find(item => item.trait_type === "issue_date").value,
      expiry_date: currentCertificate.attributes.find(item => item.trait_type === "expiry_date").value,
      issuer: currentCertificate.from,
      transaction: currentCertificate.transaction_hash
    }
    if (event.target.value === 'public') {
      const result = await axios.post(`https://verify-certification-nft-production.up.railway.app/share?id=${currentCertificate.identifier}&address=${currentCertificate.name}`, shareCerti)
      if (result.data.message == "Change to public success") {
        setAlertSeverity("success");
        setMessageAlert("Change to public success");
        setShowAlert(true);
        setShareCertificate([...shareCertificate, currentCertificate]); // Add currentCertificate to shareCertificate array
        setShare(true); // Set share to true
      }
      else {
        setAlertSeverity("error");
        setMessageAlert("Change to public failed");
        setShowAlert(true);
      }

    } else {
      const result = await axios.delete(`https://verify-certification-nft-production.up.railway.app/share?id=${currentCertificate.identifier}&address=${currentCertificate.name}`, shareCerti)
      if (result.data.message == 'Change to private success') {
        setAlertSeverity("success");
        setMessageAlert("Change to private success");
        setShowAlert(true);
        setShareCertificate(shareCertificate.filter(item => item !== currentCertificate)); // Remove currentCertificate from shareCertificate array
        setShare(false); // Set share to false
      }
      else {
        setAlertSeverity("error");
        setMessageAlert("Change to private failed");
        setShowAlert(true);
      }

    }
  };
  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      setAlertSeverity("success");
      setMessageAlert("Link copied to clipboard!");
      setShowAlert(true);
    }).catch((error) => {
      setAlertSeverity("error");
      setMessageAlert("Failed to copy link.");
      setShowAlert(true);
      console.error("Failed to copy link: ", error);
    });
  };
  return (
    <div>
      {loading && (
        <div className="loading-overlay">
          <CircularProgress />
        </div>
      )}
      <div className="header-section">
        <HeaderSection />
      </div>
      <LisenceSection />

      <div className="search-bar-container">
        <div className="input-wrapper">
          <FaSearch id="search-icon" />
          <input placeholder="Type to search..." value={input} onChange={(e) => handleChange(e.target.value)} />
        </div>
      </div>
      <div className="lisenceview">
        <section className="header-section-parent">


          {certificates.length === 0 ? (
            <div>No Certificate Yet</div>
          ) : (
            <>
              <div className="body-header-wrapper">
                <div className="body-header">
                  {/* <h1 className="body-header-text2">List of Certificates</h1> */}
                </div>
              </div>
              <Button variant="contained" sx={{ fontSize: "0.5em" }} onClick={handleClickOpen}>
                <div sx={{ mx: "5px" }}>View</div>
                <RemoveRedEyeIcon sx={{ mx: "5px" }}></RemoveRedEyeIcon>
              </Button>
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
                  <Button onClick={handleCloseDialog} type="submit">Decrypt</Button>
                  <Button onClick={handleCloseDialog}>Cancel</Button>
                </DialogActions>
              </Dialog>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', flexDirection: "column" }}>

                {(isPrivateKeyValid ? filterDecryptedCertificates : filteredCertificates).map((certificate, index) => (
                  <div key={index} className="upload-wrapper-lisence" style={{ marginBottom: "50px" }}>

                    <div className="upload-lisence">

                      <div className="info_certi">
                        <div className="lisence-name-title" >{certificate.description}< VerifiedIcon sx={{ color: "green", fontSize: 50 }} /> </div>

                        {isPrivateKeyValid && (
                          <>
                            <div className="lisence-owner" style={{}}>
                              <strong>Completed by</strong> {certificate.name}
                            </div>
                            <div className="lisence-owner" style={{}}>
                              <strong>Minted by</strong> {certificate.from}
                            </div>
                            <div className="lisence-name" style={{}}>
                              <strong>Minted date</strong> {certificate.date}
                            </div>
                            {expandedCertificateIndex === index && (
                              <div className="lisence-attributes">
                                {certificate.attributes && certificate.attributes.map((attribute, attrIndex) => (
                                  <div key={attrIndex} className="lisence-name">
                                    <strong>
                                      {attributeLabels[attribute.trait_type] || attribute.trait_type}:
                                    </strong>
                                    {attribute.value !== null ? attribute.value : ''}
                                  </div>
                                ))}
                              </div>
                            )}
                            <Button
                              onClick={() => handleExpandClick(index)}
                              sx={{
                                fontSize: '1.5rem',
                              }}
                            >
                              {expandedCertificateIndex === index ? "Show Less" : "Show More"}
                            </Button>
                          </>
                        )}
                      </div>

                      <div className="img_certi">
                        {isPrivateKeyValid &&
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>

                            <Link underline="hover" href={`https://sepolia.etherscan.io/tx/${certificate.transaction_hash}`} target="_blank">
                              <div style={{ display: 'flex' }}>
                                {/* <img src="./opensea-logo.svg"></img> */}
                                <Avatar alt="Etherscan" src="./logo-etherscan.png" />
                                <ArrowOutwardIcon sx={{ fontSize: '2.5rem' }} />
                              </div>
                            </Link>

                            <Link href={certificate.opensea_url} underline="hover" target="_blank" >
                              <div style={{ display: 'flex' }}>
                                {/* <img src="./opensea-logo.svg"></img> */}
                                <Avatar alt="OpenSea" src="./opensea-logo.svg" />
                                <ArrowOutwardIcon sx={{ fontSize: '2.5rem' }} />
                              </div>

                            </Link>
                          </Box>}

                        <MultiActionAreaCard image={certificate.image_url} size={500} download={true} />
                        {isPrivateKeyValid && (
                          <div>
                            <div className="opensea-share-container">

                              <Box sx={{ minWidth: 240, marginTop: '10px' }}>
                                <FormControl fullWidth>
                                  <Select
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    value={shareCertificate.some(cert => cert.id === certificate.identifier) ? 'public' : 'private'}
                                    label="Share"
                                    onChange={(e) => handleShareChange(e, certificate)} // Pass certificate as parameter
                                    sx={{ fontSize: '1.5rem' }}
                                  >
                                    <MenuItem sx={{ fontSize: '1.5rem' }} value="public">Public</MenuItem>
                                    <MenuItem sx={{ fontSize: '1.5rem' }} value="private">Private</MenuItem>
                                  </Select>
                                </FormControl>
                              </Box>
                              {shareCertificate.some(cert => cert.id === certificate.identifier) ?
                                <div>
                                  <Button sx={{ marginTop: '15px' }} variant="outlined" onClick={() => handleCopyLink(`http://localhost:3000/share/${certificate.identifier}?address=${certificate.name}`)}>
                                    <Link className="share-link" sx={{ fontSize: "1.5rem" }}>Copy Link</Link>
                                    <LinkIcon></LinkIcon>
                                  </Button>

                                </div>
                                :
                                <></>}

                            </div>

                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                ))}
                <Snackbar open={showAlert} autoHideDuration={3000} onClose={handleClose}>
                  <Alert
                    onClose={handleClose}
                    severity={alertSeverity}
                    variant="filled"
                    sx={{ width: '100%' }}
                  >
                    {messageAlert}
                  </Alert>
                </Snackbar>
              </div>
            </>
          )}
        </section >
        <Footer shapeLeft="/shape-left@2x.png" socialIcontwitter="/socialicontwitter@2x.png" />
      </div >
    </div >
  );
};

export default LisenceView;


