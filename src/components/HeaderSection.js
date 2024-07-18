import { useNavigate } from "react-router-dom";
import Menu from '@mui/material/Menu';
import useSigner from "../state/signer";
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import React, { useState, useEffect, useCallback } from 'react';
import NotificationBell from "./NotificationBell";
import { Button } from "@mui/material";
import axios from 'axios';
import AddressAvatar from "../components/AddressAvatar";
import "./BasicMenu.css";
import "./HeaderSection.css";
const { ethers } = require("ethers");

const settings = [
  { name: 'Profile', route: '/profile' },

  { name: 'Issuer Management', route: '/admin' },
];

const HeaderSection = () => {
  const SOULBOUND_ADDRESS = process.env.REACT_APP_SOULBOUND_ADDRESS;
  const { signer, address, connectWallet, getPublicKey, contract } = useSigner();
  const [tickets, setTickets] = useState([]);
  const [loadingPage, setLoadingPage] = useState(false);
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [messageAlert, setMessageAlert] = useState("");
  const [issuers, setIssuers] = useState([]);
  const [alertSeverity, setAlertSeverity] = useState("");
  const [org, setOrg] = useState('');
  const [isIssuer, setIsIssuer] = useState(false);
  const [admin, setAdmin] = useState('')

  const navigate = useNavigate();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleMenuItemClick = (route) => {
    if (address) {
      setLoadingPage(true);
      setTimeout(() => {
        handleCloseUserMenu();
        navigate(route);
        setLoadingPage(false);
      }, 500);
    } else {
      connectWallet();
    }
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowAlert(false);
  };
  const handleLogin = () => {
    const checkMetaMask = () => {
      if (typeof window.ethereum !== 'undefined') {
        connectWallet();
      } else {
        window.open('https://metamask.io/download/', '_blank');
      }
    };

    // Check MetaMask installation after the window has fully loaded
    if (document.readyState === 'complete') {
      checkMetaMask();
    } else {
      window.addEventListener('load', checkMetaMask);
      return () => window.removeEventListener('load', checkMetaMask);
    }
  };


  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const allTickets = await axios("https://verify-certification-nft-production.up.railway.app/tickets/all");
        if (Array.isArray(allTickets.data.tickets)) {
          const newTickets = allTickets.data.tickets.filter(
            (ticket) => ticket.issuer_address === address || ticket.owner_address === address
          );
          setTickets(newTickets);
        } else {
          throw new Error('Unexpected data format');
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchTickets();
  }, [signer, address]);

  useEffect(() => {
    const insertPubToDB = async () => {
      if (address) {
        try {
          const checkPublicKeyExisted = await axios.get(`https://verify-certification-nft-production.up.railway.app/addresses/${address}`);
          if (checkPublicKeyExisted.data.address.length === 0) {
            const publicKey = await getPublicKey();
            if (publicKey.code === 4001 && publicKey.message === "User rejected the request.") {
              setAlertSeverity("warning");
              setMessageAlert("Reject to sign");
              setShowAlert(true);
              return;
            }

            await axios.post(`https://verify-certification-nft-production.up.railway.app/addresses/${address}`, {
              address,
              publicKey,
            });
            setAlertSeverity("success");
            setMessageAlert("Sign successfully");
            setShowAlert(true);
          }
          else if (checkPublicKeyExisted.data.address.length !== 0) {
            if (checkPublicKeyExisted.data.address[0].publickey == null) {
              const publicKey = await getPublicKey(); // Await the result of getPublicKey
              if (publicKey.code === 4001 && publicKey.message === "User rejected the request.") {
                setAlertSeverity("warning");
                setMessageAlert("Reject to sign");
                setShowAlert(true);
                return
              }
              await axios.post(`https://verify-certification-nft-production.up.railway.app/addresses/${address}`, {
                address: address, // Include the address in the body
                publicKey: publicKey // Include the public key in the body
              });

              setAlertSeverity("success");
              setMessageAlert("Sign successfully");
              setShowAlert(true);
            }
          }
        } catch (err) {
          console.log("INSERT PUB")
          console.log(err);
        }
      }
    };
    insertPubToDB();
  }, [address, signer]);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        if (signer && address) {
          const orgs = await contract.getOrganizationCodes();
          const results = [];
          for (const org of orgs) {
            const orgIssuers = await contract.getVerifiersByOrganizationCode(org);
            orgIssuers.forEach((issuer) => {
              results.push({ issuer });
            });
          }
          setIssuers(results);
        }
      } catch (err) {
        console.log("FETCH ORG")
        console.log(err);
      }
    };
    fetchOrg();
  }, [signer, address, contract]);

  useEffect(() => {
    const isAddressInIssuers = async () => {
      try {
        if (address && issuers.length > 0) {
          const issuer = issuers.find((issuer) => issuer.issuer === address);
          if (issuer) {
            const orgs = await contract.getOrganizationCodes();
            for (const org of orgs) {
              const orgIssuers = await contract.getVerifiersByOrganizationCode(org);
              if (orgIssuers.includes(address)) {
                setOrg(org);
                setIsIssuer(true);
                return;
              }
            }
          }
        }
      } catch (err) {
        console.log(err);
      }
      setIsIssuer(false);
    };

    isAddressInIssuers();
  }, [address, issuers, contract]);
  useEffect(() => {
    const checkAdmin = () => {
      try {
        if (address && address == process.env.REACT_APP_ADMIN) {

          setAdmin('ADMIN')
        }
      }
      catch (err) {
        console.log(err)
      }

    }
    checkAdmin()
  }, [signer, address])

  const filteredSettings = address === process.env.REACT_APP_ADMIN
    ? settings
    : settings.filter((setting) => setting.name !== 'Issuer Management');

  return (
    <section className="header-section1">
      <div className="top-header">
        <div className="top-container">
          <div className="fickleflight-logo-wrapper">
            <button className="fickleflight-logo" onClick={() => {
              setLoadingPage(true);
              navigate("/");
              window.location.reload();
              setLoadingPage(false);
            }}>
              <img className="abc" src="/VSCourses.svg" />
            </button>
          </div>
          <div className="navigation-right">
            <div className="account-section">
              <img className="hamburger-menu-icon" alt="" src="/hamburgermenu@2x.png" />
              <button>
                <NotificationBell tickets={tickets} />
              </button>
              <Box sx={{ flexGrow: 0 }}>
                {address ? (
                  <>
                    <Tooltip title="Open settings">
                      <IconButton sx={{ p: 0 }} onClick={handleOpenUserMenu}>
                        {isIssuer ? (
                          <div>
                            <AddressAvatar address={org} />
                          </div>
                        ) : (
                          admin ?
                            <div>
                              <AddressAvatar address={admin} />
                            </div> :

                            <div>
                              <AddressAvatar address={address} />
                            </div>
                        )}
                      </IconButton>
                    </Tooltip>
                    <Menu
                      sx={{ mt: '45px', '& .MuiPaper-root': { width: '300px' } }}
                      id="menu-appbar"
                      anchorEl={anchorElUser}
                      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                      keepMounted
                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      open={Boolean(anchorElUser)}
                      onClose={handleCloseUserMenu}
                    >
                      {filteredSettings.map((setting) => (
                        <MenuItem key={setting.name} onClick={() => handleMenuItemClick(setting.route)} sx={{ my: 1 }}>
                          <Typography textAlign="center" sx={{ fontSize: '1.3rem' }}>
                            {setting.name}
                          </Typography>
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                ) : (
                  <Button onClick={handleLogin}>LOG IN</Button>
                )}
              </Box>
              {loadingPage && (
                <div className="loading-overlay">
                  <CircularProgress />
                </div>
              )}
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeaderSection;
