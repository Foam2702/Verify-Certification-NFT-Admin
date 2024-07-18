import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useSigner from "../state/signer";
import HeaderSection from '../components/HeaderSection';
import Footer from '../components/Footer';
import AddIssuer from '../components/AddIssuer';
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import { useNavigate } from "react-router-dom";
import AddIssuerSection from '../components/AddIssuerSection';
const Admin = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { address, signer } = useSigner();
    const adminAddress = process.env.REACT_APP_ADMIN;
    const navigate = useNavigate();

    // If the address does not match the admin address, redirect to home page
    useEffect(() => {
        if (address) {
            if (address !== adminAddress) {
                navigate("*")
            }
        }
        else {
            navigate("/")
        }

    }, [address, signer])


    return (
        <>
            <HeaderSection />

            <AddIssuerSection />
            {address && address == adminAddress ?
                <AddIssuer />
                :
                <div></div>

            }
            <Footer
                shapeLeft="/shape-left1.svg"
                socialIcontwitter="/socialicontwitter1.svg"
                footerDebugCommit="unset"
                footerMarginTop="unset"
            />
        </>
    );
};

export default Admin;
