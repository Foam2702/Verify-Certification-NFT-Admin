import * as React from 'react';
import Alert from '@mui/material/Alert';
import { useState, useEffect } from 'react'


export default function AlertTicket({ severity, minter = "" }) {
    const [alert, setAlert] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (severity === "processing") {
            setAlert("warning");
            setMessage("In Processing");
        } else if (severity === "reject") {
            setAlert("error");
            setMessage("Rejected");
        } else if (severity === "approved") {
            setAlert("success");
            setMessage(`Minted By ${minter}`);
        }
    }, [severity, minter]);

    return (
        <Alert variant="outlined" severity={alert} sx={{ fontSize: "1.5rem" }}>
            {message}

        </Alert>
    );
}