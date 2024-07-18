import HeaderSection from "../components/HeaderSection";
import CircularProgress from '@mui/material/CircularProgress';
import React, { useState, useEffect } from "react";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { Box, Typography, useTheme } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useSigner from "../state/signer";
import { hashImage, encryptData, pinJSONToIPFS, add0x, deletePinIPFS, extractEncryptedDataFromJson, decryptData, minifyAddress, imageFileToBase64, remove0x } from "../helpers/index"
const { ethers } = require("ethers");

export const Profile = () => {
    const [loading, setLoading] = useState(false);
    const [regions, setRegions] = useState([]);
    const [showAlert, setShowAlert] = useState(false);
    const [messageAlert, setMessageAlert] = useState("")
    const [alertSeverity, setAlertSeverity] = useState("");
    const [user, setUser] = useState(null)
    const [error, setError] = useState(null);
    const [isPrivateKeyValid, setIsPrivateKeyValid] = useState(false);
    const [open, setOpen] = useState(false);
    const [decryptedName, setDecryptedName] = useState('');
    const [decryptedGender, setDecryptedGender] = useState('');
    const [decryptedEmail, setDecryptedEmail] = useState('');
    const [decryptedCitizenId, setDecryptedCitizenId] = useState('');
    const [decryptedDob, setDecryptedDob] = useState('');
    const [decryptedRegion, setDecryptedRegion] = useState('');
    const [decryptedWorkUnit, setDecryptedWorkUnit] = useState('');
    const [privateKey, setPrivateKey] = useState("")
    const { signer, address, connectWallet, contract, provider, getPublicKey } = useSigner();
    const navigate = useNavigate();
    useEffect(() => {

        const fetchDataRegions = async () => {
            try {
                const result = await axios("http://localhost:8080/tickets");
                if (Array.isArray(result.data.cities)) {
                    setRegions(result.data.cities);
                } else {
                    throw new Error("Unexpected data format");
                }
            }
            catch (err) {
                console.log(err)
            }

        };

        fetchDataRegions().catch((error) => console.error(error));
    }, [])
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                if (address) {
                    console.log(address)
                    const response = await axios.get(`http://localhost:8080/addresses/${address}`);
                    const data = response.data.address[0];
                    setUser(data)
                }


            } catch (err) {
                console.log(err)
            }
        }
        fetchUserInfo().catch(err => console.log(err))
    }, [address, signer])
    const handleClickOpen = (e) => {
        e.preventDefault()
        setOpen(true);
    };
    const onCancelBtnClick = async () => {
        navigate("/")
    };
    const insertPubToDB = async () => {
        if (address) {
            try {
                const checkPublicKeyExisted = await axios.get(`http://localhost:8080/addresses/${address}`);
                if (checkPublicKeyExisted.data.address.length === 0) {
                    const publicKey = await getPublicKey(); // Await the result of getPublicKey
                    if (publicKey.code === 4001 && publicKey.message === "User rejected the request.") {
                        console.log('Error retrieving public key:', publicKey);
                        setAlertSeverity("warning");
                        setMessageAlert("You must sign to update");
                        setShowAlert(true);
                        return false;
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
                            setAlertSeverity("warning");
                            setMessageAlert("Reject to sign");
                            setShowAlert(true);
                            return false
                        }
                        await axios.post(`http://localhost:8080/addresses/${address}`, {
                            address: address, // Include the address in the body
                            publicKey: publicKey // Include the public key in the body
                        });

                        setAlertSeverity("success");
                        setMessageAlert("Sign successfully");
                        setShowAlert(true);
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
        else if (!address) {
            await connectWallet()
        }
    };
    const handleUpdateInfo = async (e) => {
        e.preventDefault()
        console.log("IM HERE")
        console.log(isPrivateKeyValid)
        if (isPrivateKeyValid) {
            setLoading(true); // Start loading before sending the request
            const check = await insertPubToDB()
            if (check) {
                const form = document.querySelector("form");
                // Get the form data
                const data = Array.from(form.elements)
                    .filter((input) => input.name)
                    .reduce(
                        (obj, input) => Object.assign(obj, { [input.name]: input.value }),
                        {}
                    );
                const fields = [
                    'citizenId', 'name', 'region', 'dob', 'gender', 'email',
                    'workUnit'
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
                const formData = new FormData();
                //Email
                let emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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
                for (const field of fields) {
                    formData.append(field, data[field]);
                }
                const ownerPublicKeysResponse = await axios.get(`http://localhost:8080/addresses/${address}`)

                const publicKeyOwner = ownerPublicKeysResponse.data.address[0].publickey

                const response = await axios.patch(`http://localhost:8080/addresses/profile/${address}`, {
                    citizenId: await encryptData(data.citizenId, privateKey, remove0x(publicKeyOwner)),
                    name: await encryptData(data.name, privateKey, remove0x(publicKeyOwner)),
                    region: await encryptData(data.region, privateKey, remove0x(publicKeyOwner)),
                    dob: await encryptData(data.dob, privateKey, remove0x(publicKeyOwner)),
                    gender: await encryptData(data.gender, privateKey, remove0x(publicKeyOwner)),
                    email: await encryptData(data.email, privateKey, remove0x(publicKeyOwner)),
                    workUnit: await encryptData(data.workUnit, privateKey, remove0x(publicKeyOwner))

                });
                if (response.data.message == "Updated successfully") {
                    setMessageAlert("Updated successfully");
                    setAlertSeverity("success");
                    setShowAlert(true);
                    setLoading(false)
                    const targetURL = localStorage.getItem('targetURL');
                    if (targetURL) {
                        navigate(targetURL);
                        // Clear the target URL from localStorage
                        localStorage.removeItem('targetURL');
                    }
                    else {
                        window.location.reload();

                    }

                }
                else {
                    setMessageAlert("Updated fail");
                    setAlertSeverity("error");
                    setShowAlert(true);
                    setLoading(false)
                    return
                }
            }
            else {
                setLoading(false)
                return
            }
        }
        else if (!isPrivateKeyValid) {
            setOpen(true)
        }

    }

    const handleClose = async (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowAlert(false);
    };
    const handleCloseDialog = () => {
        setOpen(false);
    };
    const handleSubmitPrivateKey = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        const privatekey = formJson.privatekey;

        try {

            const check = await insertPubToDB()
            if (check) {
                const privateKeyBytes = ethers.utils.arrayify(add0x(privatekey));
                const publicKeyFromPrivateKey = ethers.utils.computePublicKey(privateKeyBytes);
                const ownerPublicKeysResponse = await axios.get(`http://localhost:8080/addresses/${address}`)
                if (ownerPublicKeysResponse.data.address.length === 0) {
                    return;
                }
                const publicKeyOwner = ownerPublicKeysResponse.data.address[0].publickey
                if (publicKeyFromPrivateKey == publicKeyOwner) {
                    await decryptAllFields(privatekey)
                    // handleUpdateInfo(privatekey, check)
                    setAlertSeverity("success");
                    setMessageAlert("Correct private key");
                    setShowAlert(true);
                    setPrivateKey(privatekey)
                    setIsPrivateKeyValid(true);

                    setError(null); // Clear any previous errors
                }
                else {
                    setIsPrivateKeyValid(false);

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
    const handleDecryptInfo = async (prop, privateKey) => {
        if (prop != null && prop != '' && prop != undefined) {
            try {
                const ownerPublicKeysResponse = await axios.get(`http://localhost:8080/addresses/${address}`)
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
                console.log("handleDecryptInfo")
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
    const decryptAllFields = async (privatekey) => {
        try {
            if (privatekey) {
                setLoading(true)
                const name = await handleDecryptInfo(user.name, privatekey);
                const gender = await handleDecryptInfo(user.gender, privatekey);
                const email = await handleDecryptInfo(user.email, privatekey);
                const citizenId = await handleDecryptInfo(user.citizen_id, privatekey);
                const dob = await handleDecryptInfo(user.dob, privatekey);
                const region = await handleDecryptInfo(user.region, privatekey);
                const workUnit = await handleDecryptInfo(user.work_unit, privatekey);

                setDecryptedName(name);
                setDecryptedGender(gender);
                setDecryptedEmail(email);
                setDecryptedCitizenId(citizenId);
                setDecryptedDob(dob);
                setDecryptedRegion(region);
                setDecryptedWorkUnit(workUnit);
                setError(null); // Clear any previous errors
                setLoading(false)
            }
            else {
                setOpen(true)
            }

        } catch (err) {
            setLoading(false)
        }
    };
    return (
        <div>
            <HeaderSection />
            {loading && (
                <div className="loading-overlay">
                    <CircularProgress />
                </div>
            )}
            <section className="body-section1">
                <div className="body-header">
                    <h1 className="body-header-text2">Your information</h1>
                </div>

                {user && user.name && user.gender && user.email && user.dob && user.citizen_id && user.region && user.work_unit ?
                    <div>
                        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                            <Button variant="outlined" sx={{ my: "20px", fontSize: "0.5em" }} onClick={handleClickOpen}>
                                Click to view
                            </Button>
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
                                <Button onClick={handleCloseDialog} type="submit">Enter</Button>

                                <Button onClick={handleCloseDialog}>Cancel</Button>
                            </DialogActions>
                        </Dialog>
                        <form className="careers-section" encType="multipart/form-data" >
                            <div className="careers-section-inner">
                                <div className="name-parent">
                                    <div className="name">
                                        <h3 className="name1">Name *</h3>
                                        {isPrivateKeyValid ? (
                                            <input
                                                className="input-name"
                                                name="name"
                                                type="text"
                                                value={decryptedName}
                                                onChange={(e) => setDecryptedName(e.target.value)}
                                            />
                                        ) : (
                                            <div className="input-name">{minifyAddress(user.name)}</div>
                                        )}
                                    </div>
                                    <div className="gender">
                                        <h3 className="gender1">Gender *</h3>
                                        <select
                                            className="input-gender"
                                            name="gender"
                                            value={isPrivateKeyValid ? decryptedGender : minifyAddress(user.gender)}
                                            disabled={!isPrivateKeyValid}
                                            onChange={(e) => setDecryptedGender(e.target.value)}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div className="email">
                                        <h3 className="email1">Email *</h3>
                                        {isPrivateKeyValid ? (
                                            <input
                                                className="input-email"
                                                name="email"
                                                placeholder="abc@abc.com"
                                                type="email"
                                                value={decryptedEmail}
                                                onChange={(e) => setDecryptedEmail(e.target.value)}
                                            />
                                        ) : (
                                            <div className="input-email">{minifyAddress(user.email)}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="careers-section-child">
                                <div className="cccd-parent">
                                    <div className="cccd">
                                        <h3 className="cccd1">Citizen ID *</h3>
                                        {isPrivateKeyValid ? (
                                            <input
                                                className="input-cccd"
                                                name="citizenId"
                                                placeholder="Type here..."
                                                type="text"
                                                value={decryptedCitizenId}
                                                onChange={(e) => setDecryptedCitizenId(e.target.value)}
                                            />
                                        ) : (
                                            <div className="input-cccd">{minifyAddress(user.citizen_id)}</div>
                                        )}
                                    </div>
                                    <div className="date-of-birth">
                                        <h3 className="date-of-birth1">Date of birth *</h3>
                                        {isPrivateKeyValid ? (
                                            <input
                                                className="input-date-of-birth"
                                                name="dob"
                                                placeholder="Choose..."
                                                type="date"
                                                value={decryptedDob}
                                                onChange={(e) => setDecryptedDob(e.target.value)}
                                            />
                                        ) : (
                                            <div className="input-date-of-birth">{minifyAddress(user.dob)}</div>
                                        )}
                                    </div>
                                    <div className="home-town">
                                        <h3 className="home-town-text">Region *</h3>
                                        <select
                                            className="input-home-town"
                                            name="region"
                                            value={isPrivateKeyValid ? decryptedRegion : minifyAddress(user.region)}
                                            disabled={!isPrivateKeyValid}
                                            onChange={(e) => setDecryptedRegion(e.target.value)}
                                        >
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
                                    {isPrivateKeyValid ? (
                                        <input
                                            className="input-working-unit"
                                            name="workUnit"
                                            placeholder="Type here..."
                                            type="text"
                                            value={decryptedWorkUnit}
                                            onChange={(e) => setDecryptedWorkUnit(e.target.value)}
                                        />
                                    ) : (
                                        <div className="input-working-unit">{minifyAddress(user.work_unit)}</div>
                                    )}
                                </div>
                            </div>

                            {isPrivateKeyValid &&
                                <div className="body-button">
                                    <button className="submit-button" type="submit" onClick={handleUpdateInfo}>
                                        <div className="submit">Update</div>
                                    </button>
                                    <button className="cancel-button" type="button" onClick={onCancelBtnClick}>
                                        <div className="cancel">Cancel</div>
                                    </button>
                                </div>
                            }

                        </form>
                    </div>
                    :
                    <div>
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
                                <Button onClick={handleCloseDialog} type="submit">Enter</Button>

                                <Button onClick={handleCloseDialog}>Cancel</Button>
                            </DialogActions>
                        </Dialog>
                        <form className="careers-section" encType="multipart/form-data" >
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
                                            <option value="">Select gender ...</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>

                                    </div>
                                    <div className="email">
                                        <h3 className="email1">Email *</h3>
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
                            </div>
                            <div className="body-button">
                                <button className="submit-button" onClick={handleUpdateInfo}>
                                    <div className="submit">Update</div>
                                </button>
                                <button className="cancel-button" type="button" onClick={onCancelBtnClick}>
                                    <div className="cancel">Cancel</div>
                                </button>
                            </div>


                        </form>
                    </div>

                }
                <Snackbar open={showAlert} autoHideDuration={10000} onClose={handleClose}>
                    <Alert
                        onClose={handleClose}
                        severity={alertSeverity}
                        variant="filled"
                        sx={{ width: '100%', fontSize: '1.25rem' }}
                    >
                        {messageAlert}
                    </Alert>
                </Snackbar>
            </section >

        </div >
    );
}

