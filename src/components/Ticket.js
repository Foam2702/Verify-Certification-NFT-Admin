import "./Ticket.css";
import React, { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import Web3 from 'web3';
import useSigner from "../state/signer";
import MultiActionAreaCard from "./MultiACtionAreaCard";
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Box, Typography, useTheme } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';// import Header from "../../components/Header";
import { Tooltip, IconButton } from '@mui/material';
import CachedIcon from '@mui/icons-material/Cached';
import { formatDate } from '../helpers/index'
import { useNavigate } from "react-router-dom";
import AlertTicket from "./AlertTicket"
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import WalletIcon from '@mui/icons-material/Wallet';
import { hashImage, pinJSONToIPFS, excelDateToJSDate, deletePinIPFS, remove0x, extractEncryptedDataFromJson, decryptData, minifyAddress, imageFileToBase64 } from "../helpers/index"
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import * as XLSX from "xlsx";
const JWT = process.env.REACT_APP_JWT; // Make sure to set this in your React app environment variables
import { styled } from '@mui/material/styles';
import { format } from "date-fns";
import "./BodySection.css";
import "../pages/LisenceView"
const Ticket = ({ ticket }) => {
    const { signer, address, connectWallet, contract, provider } = useSigner()
    const [file, setFile] = useState(null);
    const [issuer, setIssuer] = useState([])
    const [showAlert, setShowAlert] = useState(false);
    const [messageAlert, setMessageAlert] = useState("")
    const [loading, setLoading] = useState(false);
    const [update, setUpdate] = useState(false)
    const [countdown, setCountdown] = useState(3)
    const [transaction, setTransaction] = useState("")
    const [addressContract, setAddressContract] = useState("")
    const [alertSeverity, setAlertSeverity] = useState("");
    const [correctPriv, setCorrectPriv] = useState(false)
    const [tokenID, setTokenID] = useState("")
    const [open, setOpen] = useState(false);
    const [privateKey, setPrivateKey] = useState("")
    const [isPrivateKeyValid, setIsPrivateKeyValid] = useState(false);

    const [error, setError] = useState(null);
    const [decryptedName, setDecryptedName] = useState('');
    const [decryptedGender, setDecryptedGender] = useState('');
    const [decryptedEmail, setDecryptedEmail] = useState('');
    const [decryptedCitizenId, setDecryptedCitizenId] = useState('');
    const [decryptedDob, setDecryptedDob] = useState('');
    const [decryptedRegion, setDecryptedRegion] = useState('');
    const [decryptedWorkUnit, setDecryptedWorkUnit] = useState('');
    const [decryptedPoint, setDecryptedPoint] = useState('');
    const [decryptedIssueDate, setDecryptedIssueDate] = useState('');
    const [decryptedExpiryDate, setDecryptedExpiryDate] = useState('');
    const [decryptedImage, setDecryptedImage] = useState(null)
    const [userTicket, setUserTicket] = useState(null)
    const [imageUrl, setImageUrl] = useState('');
    const [imageMatch, setImageMatch] = useState(false)
    const [infoMatch, setInfoMatch] = useState(false)
    const [isExam, setIsExam] = useState(false)
    const [mint, setMint] = useState("")
    const web3 = new Web3(window.ethereum);
    const navigate = useNavigate();
    useEffect(() => {
        const checkIssuer = async () => {
            const { ethereum } = window;
            if (ethereum) {
                if (ticket.licensing_authority != null) {
                    try {
                        const result = await contract.getVerifiersByOrganizationCode(ticket.licensing_authority);
                        setIssuer(result)
                    }
                    catch (err) {
                        console.log(err)

                        setAlertSeverity("warning")
                        setMessageAlert("Your rights have been revoked by the admin. Return to the home page within 5 seconds")
                        setShowAlert(true);
                        setTimeout(() => {
                            navigate("/")
                        }, 5000)
                        return
                    }
                }
                else {
                    return;
                }
            }
        }
        if (ticket != null) { // Only run if ticket is defined
            checkIssuer().catch(error => console.error(error));
        }
    }, [ticket, address, signer]) // Add ticket as a dependency
    useEffect(() => {
        const getAddContractAndTokenID = async () => {
            try {
                const data = await web3.eth.getTransactionReceipt(ticket.transaction_hash);
                let transaction = data;
                console.log("TRANS", transaction.from)

                let logs = data.logs;
                const tokenIdValue = web3.utils.hexToNumber(logs[0].topics[3]);
                setMint(transaction.from)
                setTokenID(tokenIdValue.toString());
                setAddressContract(logs[0].address)
            } catch (err) {
                console.log(err)
            }
        }
        getAddContractAndTokenID()
    }, [ticket])
    useEffect(() => {
        const decryptAllFields = async () => {
            try {
                setLoading(true)
                const name = await handleDecryptTicket(ticket.name, privateKey);
                const gender = await handleDecryptTicket(ticket.gender, privateKey);
                const email = await handleDecryptTicket(ticket.email, privateKey);
                const citizenId = await handleDecryptTicket(ticket.citizen_id, privateKey);
                const dob = await handleDecryptTicket(ticket.dob, privateKey);
                const region = await handleDecryptTicket(ticket.region, privateKey);
                const workUnit = await handleDecryptTicket(ticket.work_unit, privateKey);
                const point = await handleDecryptTicket(ticket.point, privateKey);
                const issueDate = await handleDecryptTicket(ticket.issue_date, privateKey);
                const expiryDate = await handleDecryptTicket(ticket.expiry_date, privateKey);
                const imageCertificate = await handleDecryptImage(ticket.certificate_cid, privateKey)
                setDecryptedName(name);
                setDecryptedGender(gender);
                setDecryptedEmail(email);
                setDecryptedCitizenId(citizenId);
                setDecryptedDob(dob);
                setDecryptedRegion(region);
                setDecryptedWorkUnit(workUnit);
                setDecryptedPoint(point);
                setDecryptedIssueDate(issueDate);
                setDecryptedExpiryDate(expiryDate);
                setDecryptedImage(imageCertificate)
                setError(null); // Clear any previous errors
                setLoading(false)
            } catch (err) {
                setLoading(false)
                // setError("Wrong private key"); // No need to set error here since it's already set in handleDecryptTicket
            }
        };

        if (ticket && privateKey) {
            decryptAllFields();
        }
    }, [ticket, privateKey]);
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await axios('http://localhost:8080/courses');
                const courses = response.data.courses; // Assuming the API response structure
                if (ticket.certificate_name) {
                    const match = courses.some(course => {

                        if (course.name === ticket.certificate_name) {
                            console.log(course.name)
                            console.log(ticket.certificate_name)
                        }
                        return course.name === ticket.certificate_name
                    });
                    setIsExam(match)
                    setImageMatch(match);
                }
            } catch (error) {
                console.error('Failed to fetch courses:', error);
            }
        };
        fetchCourses();
    }, [ticket, setImageMatch]);
    const VisuallyHiddenInput = styled('input')({
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
        height: 1,
        overflow: 'hidden',
        position: 'absolute',
        bottom: 0,
        left: 0,
        whiteSpace: 'nowrap',
        width: 1,
    });
    const handleReject = async (e) => {
        e.preventDefault()
        try {
            const checkIssuer = await contract.getOrganizationCode(address)
            if (!checkIssuer) {
                setAlertSeverity("warning")
                setMessageAlert("Your rights have been revoked by the admin. Return to the home page within 10 seconds")
                setShowAlert(true);
                setTimeout(() => {
                    navigate("/")
                }, 10000)
                return
            }
            console.log(checkIssuer)
        } catch (err) {
            console.log(err)

            setAlertSeverity("warning")
            setMessageAlert("Your rights have been revoked by the admin. Return to the home page within 10 seconds")
            setShowAlert(true);
            setTimeout(() => {
                navigate("/")
            }, 10000)
            return
        }
        setLoading(true)
        try {
            const status = "reject"
            const empty = ' '
            const encodedEmpty = encodeURIComponent(empty);
            const owner = await axios(`http://localhost:8080/tickets/ticket/${ticket.id}?address=${encodedEmpty}`)
            await deletePinIPFS(owner.data.ticket[0].certificate_cid)
            for (let address of issuer) {
                const issuer_org = await axios(`http://localhost:8080/tickets/ticket/${ticket.id}?address=${address}`);
                if (issuer_org.data.ticket[0].certificate_cid) {
                    await deletePinIPFS(issuer_org.data.ticket[0].certificate_cid)
                }
            }
            const response = await axios.patch(`http://localhost:8080/tickets/ticket/${ticket.id}?status=${status}&transaction_hash=`)
            if (response.data.message === "updated successfully") {
                setLoading(false)
                setUpdate(true)
                setAlertSeverity("success")
                setMessageAlert("Rejected Successfully")
                setShowAlert(true);
                await new Promise(resolve => setTimeout(resolve, 3000));
                navigate("/")
            }
            else if (response.data.message === "update failed") {
                setLoading(false)
                setpdate(false)
                setAlertSeverity("error")
                setMessageAlert("Already Rejected")
                setShowAlert(true);
            }

        }
        catch (err) {
            console.log(err)
        }
        finally {
            setLoading(false)
        }
    }
    const handleSubmit = async (event) => {
        event.preventDefault()
        try {
            const checkIssuer = await contract.getOrganizationCode(address)
            if (!checkIssuer) {
                setAlertSeverity("warning")
                setMessageAlert("Your rights have been revoked by the admin. Return to the home page within 10 seconds")
                setShowAlert(true);
                setTimeout(() => {
                    navigate("/")
                }, 10000)
                return
            }
            console.log(checkIssuer)
        } catch (err) {
            console.log(err)

            setAlertSeverity("warning")
            setMessageAlert("Your rights have been revoked by the admin. Return to the home page within 10 seconds")
            setShowAlert(true);
            setTimeout(() => {
                navigate("/")
            }, 10000)
            return
        }
        setLoading(true);
        const empty = ' '
        const encodedEmpty = encodeURIComponent(empty);
        try {
            const userTicket = await axios(`http://localhost:8080/tickets/ticket/${ticket.id}?address=${encodedEmpty}`)
            ticket = userTicket.data.ticket[0];
            ticket.status = "approved"
        }
        catch (err) {
            console.log(err)
        }
        const metadata = await pinJSONToIPFS(ticket)
        const ipfsMetadata = `ipfs://${metadata}`
        try {
            const { ethereum } = window
            if (ethereum) {
                const result = await contract.mintSBTForAddress(
                    ticket.owner_address,
                    ipfsMetadata
                );
                setAddressContract(result.to)
                for (let address of issuer) {
                    const issuer_org = await axios(`http://localhost:8080/tickets/ticket/${ticket.id}?address=${address}`);
                    if (issuer_org.data.ticket[0].certificate_cid) {

                        await deletePinIPFS(issuer_org.data.ticket[0].certificate_cid)
                    }
                    await axios.delete(`http://localhost:8080/tickets/ticket/${ticket.id}?address=${address}`)
                }
                setLoading(false)
                setAlertSeverity("success")
                setMessageAlert("Create transaction successfully.Waiting to confirm")
                setShowAlert(true);
                await result.wait();
                const status = "approved"
                const response = await axios.patch(`http://localhost:8080/tickets/ticket/${ticket.id}?status=${status}&transaction_hash=${result.hash}&issuer_address=`)
                if (response.data.message === "updated successfully") {
                    ticket.transaction_hash = result.hash
                    setLoading(false);
                    setAlertSeverity("success")
                    setMessageAlert("Mint Successfully")
                    setShowAlert(true);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    navigate("/")
                }
                else if (response.data.message === "update failed") {
                    setLoading(false);
                    setUpdate(false)
                    setAlertSeverity("error")
                    setMessageAlert("Mint Fail")
                    setShowAlert(true);
                }
            }
        } catch (err) {
            await deletePinIPFS(metadata)
            setLoading(false);
            setAlertSeverity("error");
            setMessageAlert("Rejected transaction");
            setShowAlert(true);
            window.location.reload();
        }
    };
    const handleClose = async (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowAlert(false);
        await new Promise(resolve => setTimeout(resolve, 1000));
    };
    const handleCancle = async () => {
        setLoading(true);
        setLoading(false);
        navigate("/")
    }
    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleCloseDialog = () => {
        setOpen(false);
    };
    const handleSubmitPrivateKey = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        const privatekey = formJson.privatekey;
        setPrivateKey(privatekey)
    }

    async function addNFTToWallet() {
        setLoading(true)
        if (addressContract && tokenID) {
            try {

                const wasAdded = await ethereum.request({
                    method: 'wallet_watchAsset',
                    params: {
                        type: 'ERC721',
                        options: {
                            address: addressContract,
                            tokenId: tokenID,
                        }
                    },
                });
                if (wasAdded) {
                    setLoading(false);
                    setAlertSeverity("success")
                    setMessageAlert("Added to Wallet")
                    setShowAlert(true);
                }
                else {
                    setUpdate(false)
                    setAlertSeverity("error")
                    setMessageAlert("Add to Wallet failed")
                    setShowAlert(true);
                }
            } catch (error) {
                console.log('Oops! Something went wrong:', error);
            }
        } else {
            console.log('addressContract or tokenID is not defined');
        }
        setLoading(false)
    }
    const handleDecryptTicket = async (prop, privateKey) => {
        if (prop != null && prop != '' && prop != undefined) {
            try {
                const ownerPublicKeysResponse = await axios.get(`http://localhost:8080/addresses/${ticket.owner_address}`)
                if (ownerPublicKeysResponse.data.address.length === 0) {
                    return;
                }
                const publicKeyOwner = ownerPublicKeysResponse.data.address[0].publickey
                const parseProp = extractEncryptedDataFromJson(prop)

                const result = await decryptData(parseProp.cipher, parseProp.iv, remove0x(publicKeyOwner), privateKey);

                if (result === "") {

                    setError("Wrong private key"); // Set the error state
                    setLoading(true);
                    setLoading(false);
                    setAlertSeverity("error")
                    setMessageAlert("Wrong private key")
                    setShowAlert(true);
                    return minifyAddress(prop.toString()); // Return the original prop value in case of error
                }
                return result;
            } catch (error) {
                if (error.message.includes("Cipher key could not be derived")) {

                    setError("Wrong private key"); // Set the error state
                    setLoading(true);
                    setLoading(false);
                    setAlertSeverity("error")
                    setMessageAlert("Wrong private key")
                    setShowAlert(true);
                } else {

                    setError("Error decrypting data");
                    setLoading(true);
                    setLoading(false);
                    setAlertSeverity("error")

                    setMessageAlert("Wrong private key")
                    setShowAlert(true);
                }
                return minifyAddress(prop.toString());
            }
        }
        else {
            return " ";
        }
    };
    const handleDecryptImage = async (prop, privateKey) => {
        try {
            const res = await axios(
                `https://coral-able-takin-320.mypinata.cloud/ipfs/${prop}`

            );
            const image = res.data.image
            const ownerPublicKeysResponse = await axios.get(`http://localhost:8080/addresses/${ticket.owner_address}`)
            if (ownerPublicKeysResponse.data.address.length === 0) {
                return;
            }
            const publicKeyOwner = ownerPublicKeysResponse.data.address[0].publickey
            const parseImg = extractEncryptedDataFromJson(JSON.stringify(image))
            const decryptedData = await decryptData(parseImg.cipher, parseImg.iv, remove0x(publicKeyOwner), privateKey);
            return decryptedData
        }
        catch (err) {
            console.log(err)
        }
    }
    const onfileChange = async (event) => {
        setImageMatch(false)
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
    const handleCheckImage = async (event) => {
        event.preventDefault();
        if (decryptedImage == null) {
            setLoading(true);
            setAlertSeverity("warning")
            setMessageAlert("Decrypt image to check")
            setShowAlert(true);
            setLoading(false);
            return;
        }
        if (imageUrl) {
            const hashStudentImg = hashImage(decryptedImage)
            const hashIssuerImg = hashImage(imageUrl)
            if (hashIssuerImg == hashStudentImg) {
                setLoading(true);
                setAlertSeverity("success")
                setMessageAlert("The two images match")
                setShowAlert(true);
                setLoading(false);
                setImageMatch(true)
            }
            else {
                setLoading(true);
                setAlertSeverity("error")
                setMessageAlert("The two images do not match")
                setShowAlert(true);
                setLoading(false);
                setImageMatch(false)
            }
        }
        else {
            setLoading(true);
            setAlertSeverity("warning")
            setMessageAlert("Upload your file")
            setShowAlert(true);
            setLoading(false);
            return;
        }
    }

    const handleFileUpload = (event) => {
        event.preventDefault();
        if (decryptedImage == null) {
            setLoading(true);
            setAlertSeverity("warning");
            setMessageAlert("Decrypt to upload");
            setShowAlert(true);
            setLoading(false);
            return;
        }
        try {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                const binaryStr = e.target.result;
                const workbook = XLSX.read(binaryStr, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                let isMatchFound = false;

                jsonData.forEach(item => {

                    let issueDate = item.issue_date ? item.issue_date : '';
                    let expiryDate = item.expiry_date ? item.expiry_date : '';
                    let dob = item.dob ? item.dob : '';

                    // Handle potential undefined values
                    let citizenId = item.citizen_id !== undefined ? item.citizen_id.toString() : '';
                    let point = item.point !== undefined ? item.point.toString() : '';

                    if (typeof item.issue_date === 'number' && issueDate != '') {
                        issueDate = format(excelDateToJSDate(item.issue_date), "yyyy-MM-dd");
                    }

                    if (typeof item.expiry_date === 'number' && expiryDate != '') {
                        expiryDate = format(excelDateToJSDate(item.expiry_date), "yyyy-MM-dd");
                    }
                    if (typeof item.dob === 'number' && dob != '') {
                        dob = format(excelDateToJSDate(item.dob), "yyyy-MM-dd");
                    }

                    if (
                        item.name === decryptedName &&
                        item.gender === decryptedGender &&
                        item.email === decryptedEmail &&
                        citizenId === decryptedCitizenId &&
                        dob === decryptedDob &&
                        item.region === decryptedRegion &&
                        item.work_unit === decryptedWorkUnit &&
                        point.trim() === decryptedPoint.trim() &&
                        item.certificate_name === ticket.certificate_name &&
                        issueDate === decryptedIssueDate &&
                        expiryDate.trim() === decryptedExpiryDate.trim() &&
                        item.licensing_authority === ticket.licensing_authority
                    ) {
                        isMatchFound = true;
                    }
                });


                if (isMatchFound) {
                    setInfoMatch(true)
                    setAlertSeverity("success");
                    setMessageAlert("Matching info found in the file");
                    setShowAlert(true);
                } else {
                    setInfoMatch(false)

                    setAlertSeverity("warning");
                    setMessageAlert("No matching info found in the file");
                    setShowAlert(true);
                }
                setLoading(false);
            };

            reader.readAsBinaryString(file);
        } catch (err) {
            console.log(err);
            setAlertSeverity("warning");
            setMessageAlert("Wrong excel format");
            setShowAlert(true);
            setLoading(false);
        }
    };
    return (
        <>
            {loading && (
                <div className="loading-overlay">
                    <CircularProgress />
                </div>
            )}
            <main className="body-section1">
                <form className="careers-section" encType="multipart/form-data" action="" >
                    <div>
                        {issuer.includes(address) ? (
                            <>
                                <div className="body-header">
                                    <h1 className="body-header-text2">Certificate Information</h1>
                                </div>

                            </>
                        ) : (
                            <>
                                <AlertTicket severity={ticket.status} minter={mint} />
                            </>
                        )}
                        {isExam &&
                            <Alert variant="outlined" severity="info" sx={{ fontSize: "1.5rem", my: "20px" }}>
                                Certificate of passing exam at VSCourses
                            </Alert>}
                        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                            {ticket.status === 'approved' ? (
                                <Button variant="contained" sx={{ my: "20px", mx: "30px", fontSize: "1.5rem" }} onClick={addNFTToWallet}>
                                    <div sx={{ mx: "5px" }}>MetaMask</div>

                                    < WalletIcon sx={{ mx: "5px" }} />
                                </Button>
                            ) : (
                                <></>
                            )}
                            <Button variant="contained" sx={{ my: "20px", mx: "30px", fontSize: "0.5em" }} onClick={handleClickOpen}>
                                <div sx={{ mx: "5px" }}>View</div>
                                <RemoveRedEyeIcon sx={{ mx: "5px" }}></RemoveRedEyeIcon>
                            </Button>
                            {issuer.includes(address) &&
                                <Button
                                    component="label"
                                    role={undefined}
                                    variant="contained"
                                    tabIndex={-1}
                                    startIcon={<CloudUploadIcon />}
                                    sx={{ backgroundColor: 'purple', my: "20px", mx: "30px", fontSize: "0.5em" }}
                                    onChange={handleFileUpload}

                                >
                                    Upload file
                                    <VisuallyHiddenInput type="file" />
                                </Button>
                            }

                        </Box>
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
                                        '& .MuiInputBase-input': {
                                            fontSize: '1.25rem', // Increase font size
                                        },
                                        '& .MuiInputLabel-root': {
                                            fontSize: '1.25rem', // Increase label font size
                                        },

                                    }}
                                />

                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseDialog} type="submit">Decrypt</Button>

                                <Button onClick={handleCloseDialog}>Cancel</Button>
                            </DialogActions>
                        </Dialog>
                    </div>

                    <div className="careers-section-inner">
                        <div className="name-parent">
                            <div className="name">
                                <h3 className="name1">Name *</h3>
                                {(privateKey) ?
                                    <h3 className="input-name" name="name" type="text">{decryptedName}</h3>
                                    :
                                    <h3 className="input-name" name="name" type="text">{minifyAddress(ticket.name)}</h3>
                                }
                            </div>
                            <div className="gender">
                                <h3 className="gender1">Gender *</h3>
                                <h3 className="input-gender" name="gender">
                                    {privateKey ? decryptedGender : minifyAddress(ticket.gender)}
                                </h3>
                            </div>
                            <div className="email">
                                <h3 className="email1">Email *</h3>
                                {privateKey ?
                                    <h3 className="input-email" name="email" type="email">{decryptedEmail}</h3>
                                    :
                                    <h3 className="input-email" name="email" type="email">{minifyAddress(ticket.email)}</h3>

                                }
                            </div>
                        </div>
                    </div>
                    <div className="careers-section-child">
                        <div className="cccd-parent">
                            <div className="cccd">
                                <h3 className="cccd1">Citizen ID *</h3>
                                <h3 className="input-cccd" name="citizenId" type="text">
                                    {privateKey ? decryptedCitizenId : minifyAddress(ticket.citizen_id)}
                                </h3>
                            </div>
                            <div className="date-of-birth">
                                <h3 className="date-of-birth1">Date of birth *</h3>
                                <h3 className="input-date-of-birth" name="dob" type="text">
                                    {privateKey ? decryptedDob : minifyAddress(ticket.dob)}
                                </h3>
                            </div>
                            <div className="home-town">
                                <h3 className="home-town-text">Region *</h3>
                                <h3 className="input-home-town" name="region">
                                    {privateKey ? decryptedRegion : minifyAddress(ticket.region)}
                                </h3>

                            </div>
                        </div>
                    </div>
                    <div className="careers-section-inner1">
                        <div className="working-unit-parent">
                            <div className="working-unit">
                                <h3 className="working-unit-text">Work Unit *</h3>
                                <h3 className="input-working-unit" name="workUnit" type="text">
                                    {privateKey ? decryptedWorkUnit : minifyAddress(ticket.work_unit)}
                                </h3>
                            </div>

                            <div className="score">
                                <h3 className="score-text">Point</h3>
                                <h3 className="input-score" name="point" type="text">
                                    {privateKey ? decryptedPoint : minifyAddress(ticket.point)}
                                </h3>
                            </div>
                            <div className="name-of-vertification">
                                <h3 className="name-of-vertification1">Certificate name *</h3>
                                <h3 className="input-name-of-vertification" name="certificateName"  >
                                    {ticket.certificate_name}
                                </h3>
                            </div>

                            <div className="date-vertification">
                                <h3 className="date-vertification-text">Issue Date *</h3>
                                <h3 className="input-date-vertification" name="issueDate" type="text">
                                    {privateKey ? decryptedIssueDate : minifyAddress(ticket.issue_date)}
                                </h3>
                            </div>
                            <div className="expired-date">
                                <h3 className="expired-date-text">Expiry Date</h3>
                                <h3 className="input-expired-date" name="expiryDate" type="text">
                                    {privateKey ? decryptedExpiryDate : minifyAddress(ticket.expiry_date)}
                                </h3>
                            </div>
                            <div className="vertification-unit">
                                <h3 className="vertification-unit-text">Licensing Authority *</h3>
                                <h3 className="input-vertification-unit" name="licensingAuthority" type="text" >{ticket.licensing_authority}</h3>
                            </div>
                        </div>

                    </div>

                    {issuer.includes(address) ?
                        <div className="image-hash-container">
                            <div className="upload-wrapper">
                                <div className="upload">
                                    <h3 className="upload-file-text">Image of Student</h3>
                                    <div className="">
                                        <div className="input-box-background" />

                                        <MultiActionAreaCard image={privateKey ? decryptedImage : ticket.certificate_cid} size={500} />
                                    </div>
                                </div>
                            </div>
                            {!imageMatch && <div className="upload-wrapper">
                                <div className="upload">
                                    <h3 className="upload-file-text">Image of Issuer</h3>

                                    <div className="input-box-background" />
                                    <input
                                        className="example-here"
                                        name="imageCertificate"
                                        type="file"
                                        accept=".jpg"
                                        multiple
                                        onChange={onfileChange}
                                    />
                                    <MultiActionAreaCard image={imageUrl} size={500} sx={{ Margin: 10 }} />

                                </div>
                            </div>}

                        </div>
                        :

                        <div className="upload-wrapper">
                            <div className="upload">
                                <h3 className="upload-file-text">Image of certificate</h3>
                                <div className="">
                                    <div className="input-box-background" />
                                    <div className="image-container">
                                        <MultiActionAreaCard image={privateKey ? decryptedImage : ticket.certificate_cid} size={500} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    }

                    {issuer.includes(address) ?
                        <>
                            {isExam ?
                                <div className="body-button1">
                                    {imageMatch ?
                                        <button className="submit-button" onClick={handleSubmit}>
                                            <div className="submit">Mint</div>
                                        </button>
                                        :
                                        <></>
                                    }
                                    <button className="cancel-button" onClick={handleCancle}>
                                        <div className="cancel">Cancel</div>
                                    </button>
                                </div>
                                :
                                <div className="body-button1">
                                    <button className="check-button" onClick={handleCheckImage}>
                                        <div className="check" >Check</div>
                                    </button>
                                    {imageMatch && infoMatch ?
                                        <button className="submit-button" onClick={handleSubmit}>
                                            <div className="submit">Mint</div>
                                        </button>
                                        :
                                        <></>
                                    }

                                    <button className="reject-button" onClick={handleReject}>
                                        <div className="reject">Reject</div>
                                    </button>
                                    <button className="cancel-button" onClick={handleCancle}>
                                        <div className="cancel">Cancel</div>
                                    </button>
                                </div>
                            }

                        </>
                        :
                        <></>
                    }

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

                </form>

            </main >
        </>

    );
};

export default Ticket;
