import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../theme";
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useState, useEffect } from 'react'
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';// import Header from "../../components/Header";
import useSigner from "../state/signer";
import CircularProgress from '@mui/material/CircularProgress';
import CachedIcon from '@mui/icons-material/Cached';
import { Tooltip, IconButton } from '@mui/material';
import { minifyAddress, imageFileToBase64, deletePinIPFS } from "../helpers";
import MultiActionAreaCard from "../components/MultiACtionAreaCard";
import axios from 'axios'
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import PersonOffIcon from '@mui/icons-material/PersonOff';
const AddIssuer = () => {
    const { signer, address, connectWallet, contract, provider, getPublicKey } = useSigner()
    const [issuers, setIssuers] = useState([])
    const [open, setOpen] = useState(false);
    const [openOrg, setOpenOrg] = useState(false)
    const [showAlert, setShowAlert] = useState(false);
    const [messageAlert, setMessageAlert] = useState("")
    const [loading, setLoading] = useState(false);
    const [alertSeverity, setAlertSeverity] = useState("");
    const [refresh, setRefresh] = useState(false);
    const [imageUrl, setImageUrl] = useState("")
    const [file, setFile] = useState(null)
    const [orgs, setOrgs] = useState([])
    const [org, setOrg] = useState('')
    useEffect(() => {
        const fetchOrg = async () => {
            if (signer && contract) {
                const orgs = await contract.getOrganizationCodes();
                console.log(orgs)
                let idCounter = 1; // initialize counter
                const results = [];
                for (const org of orgs) {
                    const issuers = await contract.getVerifiersByOrganizationCode(org);
                    issuers.forEach(issuer => {
                        results.push({
                            id: idCounter++, // use the counter as id and increment it
                            org: org,
                            address: issuer
                        });
                    });
                }
                console.log(results)

                setIssuers(results)
            }
        }
        fetchOrg();
    }, [refresh, address, signer])
    useEffect(() => {
        const loadOrgDB = async () => {
            try {
                const result = await axios.get("https://verify-certification-nft-production.up.railway.app/organization");
                console.log(result.data.org)
                if (Array.isArray(result.data.org)) {
                    setOrgs(result.data.org);
                } else {
                    console.error('Fetched organization data is not an array', result.data.org);
                }
            } catch (error) {
                console.error('Error fetching organization data', error);
            }
        };
        loadOrgDB();
    }, []);
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const columns = [
        { field: "id", headerName: "ID" },
        {
            field: "address",
            headerName: "Address",
            flex: 2,
            cellClassName: "name-column--cell",
        },

        {
            field: "org",
            headerName: "Organization",
            flex: 1,
        },
        {
            field: 'delete',
            headerName: 'Privilege',
            sortable: false,
            flex: 0.5,

            width: 100,
            disableClickEventBubbling: true,
            renderCell: (params) => {
                // const onClick = () => {
                //     const id = params.row.id;
                //     // perform delete operation
                // };

                return (
                    <Button variant="contained" color="error" startIcon={<PersonOffIcon />} sx={{ fontSize: "0.7em " }} onClick={() => handleDelete(params.row.address)}>
                        REVOKE
                    </Button>
                );
            }
        },
    ];
    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };
    const handleClickOpenOrg = () => {
        setOpenOrg(true)

    }
    const handleCloseOrg = async () => {
        setOpenOrg(false)
    }
    const handleCloseAlert = async (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowAlert(false);

    };


    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true)

        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        const newAddress = formJson.address;
        if (issuers.some(issuer => issuer.address === newAddress)) {
            setAlertSeverity("error");
            setMessageAlert("Issuer with this address already exists.");
            setShowAlert(true);
        } else {
            // Your code to add a new issuer
            try {
                const tx = await contract.addVerifier(newAddress, org);
                setLoading(false)
                setAlertSeverity("success");
                setMessageAlert("Create transaction successfully.Waiting to confirm");
                setShowAlert(true);
                await tx.wait();
                await axios.post(`https://verify-certification-nft-production.up.railway.app/addresses?address=${newAddress}`)

                setLoading(false)
                setAlertSeverity("success");
                setMessageAlert("Add Issuer successfully");
                setShowAlert(true);
                setRefresh(prevFlag => !prevFlag)

            } catch (err) {
                setLoading(false)

                setAlertSeverity("error");
                // Check if the error code indicates the user rejected the transaction
                if (err.code === "ACTION_REJECTED") {
                    setMessageAlert("Rejected transaction");
                } else {
                    setMessageAlert("Failed to add new issuer");
                }
                setShowAlert(true);

            }
        }
        handleClose();
    };
    const handleSubmitOrg = async (event) => {
        event.preventDefault();
        setLoading(true)
        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        const newOrganization = formJson.organization;
        const org = {
            newOrganization,
            imageUrl
        }
        console.log(org)
        // Your code to add a new issuer
        try {
            const result = await axios.post("https://verify-certification-nft-production.up.railway.app/organization", org)
            if (result.data.message == "insert success") {
                setAlertSeverity("success");
                setMessageAlert("Add Organization successfully");
                setShowAlert(true);
                setLoading(false)
            }
            else if (result.data.message == "insert fail") {
                setAlertSeverity("warning");
                setMessageAlert("Add Organization fail");
                setShowAlert(true);
                setLoading(false)
            }
            else {
                setAlertSeverity("warning");
                setMessageAlert("Something went wrong");
                setShowAlert(true);
                setLoading(false)
            }

        } catch (err) {
            setAlertSeverity("error");
            setMessageAlert("Error");
            setShowAlert(true);
            setLoading(false)
        }

        handleCloseOrg();
        setImageUrl("")

    }
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
    const handleChangeOrg = (event) => {
        setOrg(event.target.value);
    };

    const handleDelete = async (address) => {
        try {
            setLoading(true)
            const getOrgFromIssuer = await contract.getOrganizationCode(address)
            const tx = await contract.removeVerifier(address);
            setLoading(false)
            setAlertSeverity("success");
            setMessageAlert("Create transaction successfully.Waiting to confirm");
            setShowAlert(true);
            await tx.wait();
            //xóa ticket và hình ảnh chứng chỉ lquan đến issuer vừa xóa
            const tickets = await axios(`https://verify-certification-nft-production.up.railway.app/tickets/address?address=${address}`)
            tickets.data.tickets.map(async ticket => {
                await deletePinIPFS(ticket.certificate_cid)
                await axios.delete(`https://verify-certification-nft-production.up.railway.app/tickets/address?address=${address}`)
            })
            const checkOrg = await contract.getVerifiersByOrganizationCode(getOrgFromIssuer)
            //kiểm tra có phải issuer cuối cùng bị xóa khỏi tổ chức
            if (checkOrg.length == 0) {
                //xóa ticket lquan đến tổ chức vừa xóa
                const tickets_from_org = await axios(`https://verify-certification-nft-production.up.railway.app/tickets/${getOrgFromIssuer}`)
                tickets_from_org.data.tickets.map(async ticket => {
                    if (ticket.status == 'processing') {
                        await deletePinIPFS(ticket.certificate_cid)
                        await axios.delete(`https://verify-certification-nft-production.up.railway.app/tickets/address?address=${ticket.owner_address}`)
                    }

                })
                //xóa tổ chức
                await axios.delete(`https://verify-certification-nft-production.up.railway.app/organization?org=${getOrgFromIssuer}`)
            }
            setLoading(false)
            setAlertSeverity("success");
            setMessageAlert("Delete Issuer successfully");
            setShowAlert(true);
            setRefresh(prevFlag => !prevFlag)

        } catch (err) {
            setLoading(false)

            setAlertSeverity("error");
            // Check if the error code indicates the user rejected the transaction
            if (err.code === "ACTION_REJECTED") {
                setMessageAlert("Rejected transaction");
            } else {
                setMessageAlert("Failed to delete issuer");
            }
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
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" color="success" sx={{ my: "20px", mx: "30px", fontSize: "1em" }} onClick={handleClickOpen}>
                    <AddIcon />
                    NEW ISSUER
                </Button>

                <Button variant="contained" color="success" sx={{ my: "20px", fontSize: "1em" }} onClick={handleClickOpenOrg}>
                    <AddIcon />
                    NEW ORGANIZATION
                </Button>
                <Tooltip title="Refresh" sx={{ mx: '20px' }}>
                    <IconButton size="large" onClick={() => setRefresh(prevFlag => !prevFlag)}>
                        <CachedIcon fontSize="large" />
                    </IconButton>
                </Tooltip>
            </Box>
            {/* Open Issuer */}
            <Dialog
                open={open}
                onClose={handleClose}
                PaperProps={{
                    component: 'form',
                    onSubmit: handleSubmit

                }}

                maxWidth="md" // Adjust this value as needed (sm, md, lg, xl)
                sx={{
                    '& .MuiDialogContent-root': { fontSize: '1.25rem' }, // Adjust font size for dialog content
                    '& .MuiTextField-root': { fontSize: '1.25rem' }, // Adjust font size for text fields
                    '& .MuiButton-root': { fontSize: '1.25rem' }, // Adjust font size for buttons
                }}
            >
                <DialogTitle sx={{ fontSize: '1.5rem' }}>New Issuer</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: '1.5rem' }}>
                        To add new issuer to organization, please enter wallet address and organization here.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        required
                        margin="normal"
                        id="name"
                        name="address"
                        label="Wallet Address"
                        type="address"
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
                    <InputLabel id="demo-simple-select-label">Organization</InputLabel>
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={org}
                        fullWidth
                        label="Organization"
                        onChange={handleChangeOrg}
                    >
                        {orgs.map((organization) => (
                            <MenuItem value={organization.org}>{organization.org}</MenuItem>
                        ))}
                    </Select>

                </DialogContent>
                <DialogActions>
                    <Button type="submit">Add</Button>

                    <Button onClick={handleClose}>Cancel</Button>
                </DialogActions>
            </Dialog>
            {/* Open Org */}
            <Dialog
                open={openOrg}
                onClose={handleCloseOrg}
                PaperProps={{
                    component: 'form',
                    onSubmit: handleSubmitOrg

                }}

                maxWidth="md" // Adjust this value as needed (sm, md, lg, xl)
                sx={{
                    '& .MuiDialogContent-root': { fontSize: '1.25rem' }, // Adjust font size for dialog content
                    '& .MuiTextField-root': { fontSize: '1.25rem' }, // Adjust font size for text fields
                    '& .MuiButton-root': { fontSize: '1.25rem' }, // Adjust font size for buttons
                }}
            >
                <DialogTitle sx={{ fontSize: '1.5rem' }}>New Organization</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: '1.5rem' }}>
                        To add new organization , please enter name and logo of your organization.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        required
                        margin="normal"
                        id="name"
                        name="organization"
                        label="Organization name"
                        type="organization"
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
                    <div className="input-upload-file" style={{ border: '1px solid', width: '100%', marginTop: '20px' }}>
                        <div className="input-box-background" />
                        <input
                            className="example-here"
                            name="imageCertificate"
                            type="file"
                            accept=".jpg"
                            multiple
                            onChange={onfileChange}
                        />
                        <MultiActionAreaCard image={imageUrl} size={350} sx={{ Margin: 10 }} />

                    </div>
                </DialogContent>
                <DialogActions>
                    <Button type="submit">Add</Button>

                    <Button onClick={handleCloseOrg}>Cancel</Button>
                </DialogActions>
            </Dialog>
            <Box m="20px">
                <Box
                    m="40px 0 0 0"
                    height="75vh"
                    sx={{
                        "& .MuiDataGrid-root": {
                            border: "none",
                            fontSize: "1.5em", // Increase font size here
                        },
                        "& .MuiDataGrid-cell": {
                            borderBottom: "none",
                        },
                        "& .name-column--cell": {
                            color: colors.greenAccent[300],
                        },
                        "& .MuiDataGrid-columnHeaders": {
                            backgroundColor: colors.blueAccent[700],
                            borderBottom: "none",
                        },
                        "& .MuiDataGrid-virtualScroller": {
                            backgroundColor: colors.primary[400],
                        },
                        "& .MuiDataGrid-footerContainer": {
                            borderTop: "none",
                            backgroundColor: colors.blueAccent[700],
                        },
                        "& .MuiCheckbox-root": {
                            color: `${colors.greenAccent[200]} !important`,
                        },
                    }}
                >
                    <DataGrid rows={issuers} columns={columns} />

                </Box>

            </Box>
            <Snackbar open={showAlert} autoHideDuration={3000} onClose={handleCloseAlert}>
                <Alert
                    onClose={handleCloseAlert}
                    severity={alertSeverity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {messageAlert}
                </Alert>
            </Snackbar>
        </>
    );
};

export default AddIssuer;
