import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import {
    Grid,
    Paper,
    Typography,
    CircularProgress,
    AppBar,
    Toolbar,
    Button,
    IconButton,
    Radio,
    RadioGroup,
    FormControlLabel,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Snackbar,
    Alert
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import useSigner from "../state/signer";
import { v4 as uuidv4 } from 'uuid'
const { ethers } = require("ethers");

import { hashImage, isExistsInPinata, encryptData, decryptData, extractEncryptedDataFromJson, add0x, remove0x, imageUpload, fetchImagePinata, addFileToIPFS, imageFileToBase64, base64ToImageFile } from "../helpers";
export default function RowRadioButtonsGroup({ course, exam }) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [responseData, setResponseData] = useState([]);
    const [values, setValues] = useState(Array(exam.length).fill(''));
    const { address, connectWallet, contract } = useSigner();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [openCheck, setOpenCheck] = useState(false);
    const [messageAlert, setMessageAlert] = useState("");
    const [message, setMessage] = useState("")
    const [passed, setPassed] = useState(false);
    const [privateKey, setPrivateKey] = useState("")
    const [image, setImage] = useState("")
    const [point, setPoint] = useState(0)
    const [error, setError] = useState(null);
    const [alertSeverity, setAlertSeverity] = useState("");
    const [showAlert, setShowAlert] = useState(false);
    const [organization, setOrganization] = useState('')
    const canvasRef = useRef(null);
    const navigate = useNavigate();
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Initial canvas setup
        ctx.fillStyle = '#FFF'; // Background color
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#000'; // Text color
        ctx.textAlign = 'center'; // Center align text horizontally


        ctx.font = '24px Arial';
        ctx.fillText(`Awarded to ${address}`, canvas.width / 2, 650);

        ctx.font = 'italic 18px Arial';
        ctx.fillText(`For completing ${course[0].name}`, canvas.width / 2, 670);

        ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, canvas.width / 2, 730);

    }, []);
    useEffect(() => {
        if (privateKey) {
            sendToIssuer();
        }
    }, [privateKey]);
    const handleClose = () => {
        setOpen(false);
    };
    const handleCloseAlert = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        // setLoading(true);
        setShowAlert(false);
    }
    const handleCloseCheck = () => {
        setOpenCheck(false);
    };
    const handleRadioChange = (value, i) => {
        const newValues = [...values];
        newValues[i] = value;
        setValues(newValues);
    };
    const submitResponse = async () => {
        try {
            const combinedData = exam.map((examItem, index) => ({
                ...examItem,
                response: values[index],
            }));
            const result = await axios.post(
                `http://localhost:8080/courses/course/${course[0].id}/exam?address=${address}`,
                combinedData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            const org = await axios(`http://localhost:8080/courses/course/${course[0].id}`);
            const orgName = org.data.course[0].licensing_authority;
            setOrganization(orgName)
            console.log(orgName);
            if (result.data.score >= 70) {
                setOpenCheck(false);
                setPassed(true);
                setMessage(
                    `Congratulations! You passed the exam. Please enter your private key so we can send a certificate validation request to ${org.data.course[0].licensing_authority}`
                );
                setOpen(true);
                setPoint(result.data.score)
                const canvas = canvasRef.current;
                if (!canvas) {
                    setMessageAlert('Canvas not available.');
                    return;
                }

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    setMessageAlert('Failed to get canvas context.');
                    return;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw the background image
                const backgroundImg = new Image();
                backgroundImg.crossOrigin = 'Anonymous'; // Ensure crossOrigin is set if loading from a different origin
                backgroundImg.onload = () => {
                    // Draw the background image
                    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

                    // Draw the certificate content
                    ctx.fillStyle = '#000'; // Text color
                    ctx.textAlign = 'center'; // Center align text horizontally
                    ctx.font = '24px Arial';
                    ctx.fillText(`Awarded to ${address}`, canvas.width / 2, 570);

                    ctx.font = 'italic 18px Arial';
                    ctx.fillText(`For completing ${course[0].name}`, canvas.width / 2, 630);

                    ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, canvas.width / 2, 700);

                    // Draw the logo image (if needed)
                    const logoImg = new Image();
                    logoImg.crossOrigin = 'Anonymous'; // Ensure crossOrigin is set if loading from a different origin
                    logoImg.onload = () => {
                        // Draw the logo image onto the canvas
                        ctx.drawImage(logoImg, canvas.width / 2 - 50, 430, 100, 100); // Adjust position and size as needed

                        // Generate base64 image
                        const base64Image = canvas.toDataURL('image/png');
                        setImage(base64Image)

                        // console.log(base64Image);

                        // Now you can send base64Image to your backend or perform further actions
                    };
                    logoImg.src = `/${orgName}.png`; // Set the image source for the logo
                };
                backgroundImg.src = '/certificate-background.png'; // Set the image source for the background 

            } else {
                // await axios.patch(`http://localhost:8080/exam/${course[0].id}?address=${address}&status=failed`)
                const result = await axios.delete(`http://localhost:8080/exam/${course[0].id}?address=${address}`)
                if (result.data.code == 200) {
                    setOpenCheck(false);
                    setPassed(false);
                    setMessage("You failed the exam. Good luck next time.");
                    setOpen(true);
                    setTimeout(() => navigate("/"), 3000)
                }
                else {
                    setAlertSeverity("error");
                    setMessageAlert("Something went wrong");
                    setShowAlert(true);
                    setTimeout(() => navigate("/"), 3000)


                }
            }
        } catch (err) {
            console.log(err);
        }
    };
    const handleSubmitPrivateKey = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setPrivateKey(formData.get('privatekey'))
    }
    const handleDecryptTicket = async (prop, publicKeyOwner, privateKey) => {
        if (!prop) {
            return null;
        }

        try {

            const parseProp = extractEncryptedDataFromJson(prop)
            const result = await decryptData(parseProp.cipher, parseProp.iv, remove0x(publicKeyOwner), privateKey);

            if (!result) {
                handleDecryptionError("Wrong private key");
                return null;
            }
            return result;
        } catch (error) {
            if (error.message.includes("Cipher key could not be derived")) {
                handleDecryptionError("Wrong private key");
            } else {
                handleDecryptionError("Error decrypting data");
            }
            return null;
        }
    };
    const handleDecryptionError = (message) => {
        setError(message);
        setAlertSeverity("error");
        setMessageAlert(message);
        setShowAlert(true);
        setLoading(true);
        setLoading(false);
    };
    const checkIssuer = async (licensing_authority) => {
        const { ethereum } = window;
        if (ethereum) {
            const result = await contract.getVerifiersByOrganizationCode(licensing_authority);
            return result
        }
    }

    const sendToIssuer = async () => {
        try {
            setLoading(true)
            const ownerPublicKeysResponse = await axios.get(`http://localhost:8080/addresses/${address}`)
            if (ownerPublicKeysResponse.data.address.length === 0) {
                return;
            }
            const publicKeyOwner = ownerPublicKeysResponse.data.address[0].publickey
            let image_res = ''
            let hashImg = ''
            const user = await axios(`http://localhost:8080/addresses/${address}`)
            const id = uuidv4();
            const decryptedUser = {
                name: await handleDecryptTicket(user.data.address[0].name, publicKeyOwner, privateKey),
                email: await handleDecryptTicket(user.data.address[0].email, publicKeyOwner, privateKey),
                citizenId: await handleDecryptTicket(user.data.address[0].citizen_id, publicKeyOwner, privateKey),
                gender: await handleDecryptTicket(user.data.address[0].gender, publicKeyOwner, privateKey),
                dob: await handleDecryptTicket(user.data.address[0].dob, publicKeyOwner, privateKey),
                workUnit: await handleDecryptTicket(user.data.address[0].work_unit, publicKeyOwner, privateKey),
                region: await handleDecryptTicket(user.data.address[0].region, publicKeyOwner, privateKey),
                point: point.toString(),
                issueDate: new Date().toLocaleDateString(),
                certificateName: course[0].name,
                licensingAuthority: course[0].licensing_authority
            }
            // Kiểm tra nếu bất kỳ giá trị giải mã nào là null
            for (const key in decryptedUser) {
                if (decryptedUser[key] === null) {
                    setLoading(false);
                    return; // Thoát khỏi hàm sendToIssuer nếu giải mã thất bại
                }
            }
            const fieldsToEncrypt = [
                'citizenId', 'name', 'region', 'dob', 'gender', 'email',
                'workUnit', 'point', 'issueDate'];

            hashImg = hashImage(image)
            const exists = await isExistsInPinata(hashImg)
            if (exists) {
                setLoading(false);
                setAlertSeverity("warning");
                setMessageAlert(`This certificate already belongs to someone else or you already get this certificate`);
                setShowAlert(true);
                return
            }
            const imageEncrypt = await encryptData(image, privateKey, remove0x(publicKeyOwner));
            image_res = await imageUpload(imageEncrypt, hashImg, address, decryptedUser["certificateName"])
            const issuers = await checkIssuer(course[0].licensing_authority);
            const formData = new FormData();

            for (const field of fieldsToEncrypt) {
                const encryptedData = decryptedUser[field] ? await encryptData(decryptedUser[field], privateKey, remove0x(publicKeyOwner)) : null;
                formData.append(field, JSON.stringify(encryptedData));
            }
            formData.append("expiryDate", null)
            formData.append("issuerAddress", ' ')
            formData.append("cidCertificate", image_res)
            formData.append("id", id)
            formData.append("owner", address)
            formData.append("certificateName", decryptedUser["certificateName"])
            formData.append("licensingAuthority", decryptedUser["licensingAuthority"]);
            await axios.post("http://localhost:8080/tickets", formData);
            for (const issuer of issuers) {
                const issuerPublicKeysResponse = await axios.get(`http://localhost:8080/addresses/${issuer}`);
                if (issuerPublicKeysResponse.data.address.length === 0) {
                    setLoading(false); // Stop loading regardless of the request outcome
                    setAlertSeverity("warning");
                    setMessageAlert(`${data.licensingAuthority} is busy. Please comeback later`);
                    setShowAlert(true);
                    return;
                }
                else if (issuerPublicKeysResponse.data.address[0].publickey != null) {
                    const formData = new FormData();
                    const publicKeyIssuer = issuerPublicKeysResponse.data.address[0].publickey
                    const imageEncrypt = await encryptData(image, privateKey, remove0x(issuerPublicKeysResponse.data.address[0].publickey));
                    for (const field of fieldsToEncrypt) {
                        const encryptedData = decryptedUser[field] ? await encryptData(decryptedUser[field], privateKey, remove0x(publicKeyIssuer)) : null;
                        formData.append(field, JSON.stringify(encryptedData));
                    }
                    image_res = await imageUpload(imageEncrypt, hashImg, address, decryptedUser["certificateName"])
                    formData.append("expiryDate", null)
                    formData.append("issuerAddress", issuerPublicKeysResponse.data.address[0].address)
                    formData.append("cidCertificate", image_res)
                    formData.append("id", id)
                    formData.append("owner", address)
                    formData.append("certificateName", decryptedUser["certificateName"])
                    formData.append("licensingAuthority", decryptedUser["licensingAuthority"]);
                    await axios.post("http://localhost:8080/tickets", formData);
                }
            }
            setLoading(false); // Stop loading regardless of the request outcome
            setAlertSeverity("success");
            setMessageAlert(`Submitted successfully. Please wait for confirmation from the ${course[0].licensing_authority}`);
            setShowAlert(true);
            await axios.patch(`http://localhost:8080/exam/${course[0].id}?address=${address}&status=passed`)

            navigate("/")
        } catch (err) {
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
                onClose={handleClose}
                PaperProps={{
                    component: 'form',
                    onSubmit: handleSubmitPrivateKey
                }}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                sx={{
                    '& .MuiDialogContent-root': { fontSize: '1.25rem' },
                    '& .MuiTextField-root': { fontSize: '1.25rem' },
                    '& .MuiButton-root': { fontSize: '1.25rem' },
                }}
            >
                <DialogTitle id="alert-dialog-title" sx={{ fontSize: '1.5rem' }}>
                    {"Exam Results"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description" sx={{ fontSize: '1.5rem' }}>
                        {message}
                        {passed ? (
                            <div>
                                <SentimentSatisfiedAltIcon sx={{ color: 'green', width: 100, height: 100 }} />

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
                            </div>
                        ) : (
                            <SentimentVeryDissatisfiedIcon sx={{ color: 'red', width: 100, height: 100 }} />
                        )}

                    </DialogContentText>
                </DialogContent>

                <DialogActions>
                    <Button type="submit">OK</Button>


                </DialogActions>
            </Dialog>
            <Dialog
                open={openCheck}
                onClose={handleCloseCheck}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                sx={{
                    '& .MuiDialogContent-root': { fontSize: '1.25rem' },
                    '& .MuiTextField-root': { fontSize: '1.25rem' },
                    '& .MuiButton-root': { fontSize: '1.25rem' },
                }}
            >
                <DialogTitle id="alert-dialog-title" sx={{ fontSize: '1.5rem' }}>
                    {"Exam Results"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description" sx={{ fontSize: '1.5rem' }}>
                        Are you sure you want to submit the exam?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCheck}>Cancel</Button>
                    <Button onClick={submitResponse}>Submit</Button>
                </DialogActions>
            </Dialog>
            <div style={{ minHeight: '100vh' }}>
                <AppBar position="static" style={{ backgroundColor: 'teal' }}>
                    <Toolbar>
                        <IconButton
                            edge="start"
                            style={{ marginRight: '10px', marginBottom: '5px' }}
                            color="inherit"
                            aria-label="menu"
                        >
                            {/* <MenuIcon /> */}
                        </IconButton>
                        {/* <Typography variant="h6" style={{}}>
                            Exam for {course[0].name}
                        </Typography> */}
                    </Toolbar>
                </AppBar>
                <br />
                <Grid container direction="column" justify="center" alignItems="center">
                    <Grid item xs={12} sm={5} style={{ width: '100%' }}>
                        <Grid style={{ borderTop: '10px solid teal', borderRadius: 10 }}>
                            <div>
                                <Paper elevation={2} style={{ width: '100%' }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            marginLeft: '15px',
                                            paddingTop: '20px',
                                            paddingBottom: '20px',
                                        }}
                                    >
                                        <Typography variant="h4" style={{ fontFamily: 'sans-serif Roboto', marginBottom: "15px" }}>
                                            EXAM for {course[0].name}
                                        </Typography>
                                        <Typography variant="subtitle1">
                                            <p>
                                                You must score <span style={{ fontWeight: 'bold', color: 'red' }}>&gt;=70%</span> to complete the {course[0].name}
                                            </p>
                                        </Typography>
                                    </div>
                                </Paper>
                            </div>
                        </Grid>
                        <div>
                            <Grid>
                                {exam.map((ques, i) => (
                                    <div key={i}>
                                        <br />
                                        <Paper>
                                            <div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-start',
                                                        marginLeft: '6px',
                                                        paddingTop: '15px',
                                                        paddingBottom: '15px',
                                                    }}
                                                >
                                                    <Typography variant="subtitle1" style={{ marginLeft: '10px', fontSize: '1.5rem' }}>
                                                        {i + 1}. {ques.question_text}
                                                    </Typography>
                                                    <div>
                                                        <RadioGroup
                                                            aria-label="quiz"
                                                            name={`quiz-${i}`}
                                                            value={values[i]}
                                                            onChange={(e) => handleRadioChange(e.target.value, i)}
                                                        >
                                                            {Object.keys(ques)
                                                                .filter(key => key.startsWith('option_') && ques[key])
                                                                .map((key, index) => (
                                                                    <FormControlLabel
                                                                        key={index}
                                                                        value={ques[key]}
                                                                        control={<Radio />}
                                                                        label={ques[key]}
                                                                    />
                                                                ))}
                                                        </RadioGroup>
                                                    </div>
                                                </div>
                                            </div>
                                        </Paper>
                                    </div>
                                ))}
                            </Grid>


                            <Grid>
                                <br />
                                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                    <Button variant="contained" color="primary" sx={{ fontSize: '1rem' }} onClick={() => setOpenCheck(true)}>
                                        Submit
                                    </Button>

                                </div>
                                <br />
                                <br />
                            </Grid>
                        </div>
                    </Grid>
                </Grid>
            </div>
            <Snackbar open={showAlert} autoHideDuration={5000} onClose={handleCloseAlert}>
                <Alert
                    onClose={handleCloseAlert}
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
            <canvas ref={canvasRef} width="1000" height="800" style={{ display: 'none' }} />
        </>
    );
}
