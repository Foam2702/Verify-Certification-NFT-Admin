//import "./Header.css";
import { useNavigate } from "react-router-dom";

import useSigner from "../state/signer";
import AddressAvatar from "../components/AddressAvatar"
import CircularProgress from '@mui/material/CircularProgress';
import React, { useState, useEffect } from 'react';
import NotificationBell from "./NotificationBell";
import axios from 'axios';
import SOULBOUND from "../artifacts/contracts/SoulboundToken.sol/SoulboundToken.json"
import "./BasicMenu.css"
import "./HeaderSection.css";
const { ethers } = require("ethers");

const HeaderExam = () => {
    const SOULBOUND_ADDRESS = process.env.REACT_APP_SOULBOUND_ADDRESS
    const { signer, loading, address, connectWallet } = useSigner();
    const [tickets, setTickets] = useState([])
    const [loadingPage, setLoadingPage] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const allTickets = await axios("https://verify-certification-nft-production.up.railway.app/tickets/all");
                const { ethereum } = window;
                if (ethereum) {
                    const contract = new ethers.Contract(SOULBOUND_ADDRESS, SOULBOUND.abi, signer);
                    if (Array.isArray(allTickets.data.tickets)) {
                        let newTickets = [];
                        for (const ticket of allTickets.data.tickets) {
                            try {
                                const result = await contract.getVerifiersByOrganizationCode(ticket.licensing_authority);
                                if (result.includes(address)) {
                                    const ticketFromOrg = await axios(`https://verify-certification-nft-production.up.railway.app/tickets/${ticket.licensing_authority}`);
                                    if (Array.isArray(ticketFromOrg.data.tickets)) {
                                        newTickets = ticketFromOrg.data.tickets;
                                        break;
                                    } else {
                                        throw new Error('Unexpected data format');
                                    }
                                } else if (ticket.owner_address === address) {
                                    newTickets.push(ticket);
                                }
                            } catch (error) {
                                console.error('Error:', error);
                            }
                        }
                        setTickets(newTickets);
                    } else {
                        throw new Error('Unexpected data format');
                    }
                }
            } catch (err) {
                console.log(err)
            }

        };
        fetchTickets().catch(error => console.error(error));
    }, [signer, address]);


    return (
        <section className="header-section1">
            <div className="top-header">
                <div className="top-container">
                    <div className="fickleflight-logo-wrapper">
                        <button className="fickleflight-logo" onClick={() => {
                            setLoadingPage(true); // Start loading
                            setTimeout(() => {
                                navigate("/");
                                setLoadingPage(false); // Stop loading
                            }, 1000); // Delay of 2 seconds
                        }}>
                            <h3 className="abc">ABC</h3>
                        </button>
                    </div>
                    <div className="navigation-right">

                        <div className="account-section">
                            <img
                                className="hamburger-menu-icon"
                                alt=""
                                src="/hamburgermenu@2x.png"
                            />
                            <button>
                                <NotificationBell tickets={tickets} />

                            </button>
                            <button className="button" onClick={async () => {
                                if (address) {
                                    setLoadingPage(true); // Start loading
                                    setTimeout(() => {
                                        navigate("/lisenceview");
                                        setLoadingPage(false); // Stop loading

                                    }, 1000); // Delay of 2 seconds

                                } else {
                                    connectWallet();
                                }
                            }}>
                                {address ? <AddressAvatar address={address} /> : "LOG IN"}
                            </button>

                            {loadingPage && (
                                <div className="loading-overlay">
                                    <CircularProgress />
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

        </section >
    );
};

export default HeaderExam;
