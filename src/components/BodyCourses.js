import * as React from 'react';
import Course from "./Course";
import "./BodyCourses.css";
import { useEffect, useState } from 'react'
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useSigner from "../state/signer";
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { FaSearch } from 'react-icons/fa';
import "./SearchBar.css"
const BodyCourses = ({ className = "" }) => {
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [org, setOrg] = useState('');
    const [loading, setLoading] = useState(false);
    const { address, connectWallet, getPublicKey, signer, contract } = useSigner();
    const [open, setOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [alertSeverity, setAlertSeverity] = useState("");
    const [showAlert, setShowAlert] = useState(false);
    const [messageAlert, setMessageAlert] = useState("")
    const [input, setInput] = useState("")
    const navigate = useNavigate();
    useEffect(() => {
        fetchCourses().catch((error) => console.error(error));
    }, [org]);
    useEffect(() => {
        setLoading(true)
        const fetchOrg = async () => {
            try {
                if (address) {
                    const org = await contract.getOrganizationCode(address);
                    setOrg(org);
                    setLoading(false)
                }
            } catch (err) {
                setLoading(false)
                console.log(err);
            }
            setLoading(false)

        };
        fetchOrg();
    }, [address, signer, contract]);
    const fetchCourses = async () => {
        setLoading(true)
        console.log(org)
        try {
            if (org) {
                const result = await axios(`http://localhost:8080/courses/${org}`)
                console.log(result)
                if (Array.isArray(result.data.courses)) {
                    setCourses(result.data.courses);
                    setFilteredCourses(result.data.courses);
                }
                setLoading(false)

            }
            else if (!org) {
                const result = await axios.get(`http://localhost:8080/courses`);
                if (Array.isArray(result.data.courses)) {
                    setCourses(result.data.courses);
                    setFilteredCourses(result.data.courses);
                }
                setLoading(false)
            }
            setLoading(false)
        } catch (err) {
            setLoading(false)

            console.log(err);
        }
        finally {
            setLoading(false)

        }
    };
    const checkInfoExist = async () => {
        if (address) {
            try {
                const checkPublicKeyExisted = await axios.get(`http://localhost:8080/addresses/${address}`);
                if (checkPublicKeyExisted.data.address.length === 0) {
                    const publicKey = await getPublicKey(); // Await the result of getPublicKey
                    if (publicKey.code === 4001 && publicKey.message === "User rejected the request.") {
                        console.log('Error retrieving public key:', publicKey);
                        setAlertSeverity("warning");
                        setMessageAlert("You must sign to submit");
                        setShowAlert(true);
                        return false;
                    }
                    await axios.post(`http://localhost:8080/addresses/${address}`, {
                        address: address, // Include the address in the body
                        publicKey: publicKey // Include the public key in the body
                    });
                    return true
                } else if (checkPublicKeyExisted.data.address) {
                    // Check if any of the specified fields are null
                    const userInfo = checkPublicKeyExisted.data.address[0];
                    if (!userInfo.name || !userInfo.gender || !userInfo.email || !userInfo.region || !userInfo.work_unit || !userInfo.dob || !userInfo.citizen_id) {
                        return false
                    }
                    return true
                }
            } catch (err) {
                console.log(err);
            }
        }
    };
    const handleClickOpen = async (course) => {
        const checkIssuer = await contract.getOrganizationCode(address)
        console.log(checkIssuer)
        if (checkIssuer) {
            setAlertSeverity("warning")
            setMessageAlert("You are Issuer !! Can take the exam")
            setShowAlert(true);
            return
        }
        setOpen(true);
        setSelectedCourse(course)

    };
    const handleClose = () => {
        setOpen(false);
    };
    const handleCloseAlert = async (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowAlert(false);
        await new Promise(resolve => setTimeout(resolve, 1000));
    };
    const handleAgree = async () => {
        try {
            setLoading(true);
            const result = await axios.post(`http://localhost:8080/courses/course/${selectedCourse.id}?address=${address}`)
            if (result.data.code == 200) {
                if (!address) {
                    navigate("/");
                }
                else {
                    const check = await checkInfoExist()
                    if (check) {
                        navigate(`/courses/course/${selectedCourse.id}/exam`);
                    }
                    else {
                        localStorage.setItem('targetURL', `/courses/course/${selectedCourse.id}/exam`);
                        navigate("/profile")
                        setLoading(false);
                    }
                }
            }
            else {
                const result = await axios(`http://localhost:8080/exam/${selectedCourse.id}?address=${address}`)
                if (result.data.data[0].status == "examining") {
                    if (!address)
                        navigate("/");
                    else {
                        const check = await checkInfoExist()
                        if (check) {
                            navigate(`/courses/course/${selectedCourse.id}/exam`);
                        }
                        else {
                            localStorage.setItem('targetURL', `/courses/course/${selectedCourse.id}/exam`);
                            navigate("/profile")

                        }
                    }
                }
                else if (result.data.data[0].status == "passed") {
                    setLoading(false);
                    setAlertSeverity("warning")
                    setMessageAlert("You have already take this exam")
                    setShowAlert(true);
                    handleClose();
                }
            }
        } catch (err) {
            console.log(err)
        }
    };
    const handleChange = (value) => {
        setInput(value);
        const filterCourses = courses.filter((course) =>
            course.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCourses(filterCourses);
    };
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
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                sx={{
                    '& .MuiDialogContent-root': { fontSize: '1.25rem' },
                    '& .MuiTextField-root': { fontSize: '1.25rem' },
                    '& .MuiButton-root': { fontSize: '1.25rem' },
                }}            >
                <DialogTitle id="alert-dialog-title" sx={{ fontSize: '1.5rem' }}>
                    {"Ready for the exam?"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description" sx={{ fontSize: '1.5rem' }}>
                        Are you sure to start the exam?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleAgree} autoFocus>
                        Start
                    </Button>
                </DialogActions>
            </Dialog>
            <div className="search-bar-container">
                <div className="input-wrapper">
                    <FaSearch id="search-icon" />
                    <input placeholder="Type to search..." value={input} onChange={(e) => handleChange(e.target.value)} />
                </div>
            </div>
            <section className={`body-section2 ${className}`}>
                {/* <div className="body-header3">
                    <h1 className="body-header-text5">List of Exam</h1>
                    
                </div> */}

                <div className="careers-section1">
                    {filteredCourses.map((course) => (
                        <div>

                            {/* onClick={() => handleClickOpen(course)} */}
                            <button onClick={() => handleClickOpen(course)} key={course.id}>
                                <Course
                                    course1Image={course.image}
                                    courseHeader={course.name}
                                    courseDescription={course.description}
                                    courseOrg={course.licensing_authority}
                                    courseOrgImg={course.image_licensing_authority}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </section>
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

export default BodyCourses;
