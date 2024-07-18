import { IconButton, Tooltip } from "@mui/material";
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import BasicMenu from "./BasicMenu";
import { useState, useEffect } from 'react';
import Badge from '@mui/material/Badge';
import useSigner from "../state/signer";

const NotificationBell = ({ tickets }) => {
    const { signer, address, contract } = useSigner();
    const [issuers, setIssuers] = useState([]);

    const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [isIssuer, setIsIssuer] = useState(true);

    const handleOpen = (e) => {
        setAnchorEl(e.currentTarget);
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    // First useEffect to fetch issuers
    useEffect(() => {
        let isMounted = true; // Flag to check component mount status
        const fetchOrg = async () => {
            if (signer && contract) {
                const orgs = await contract.getOrganizationCodes();
                const results = [];
                for (const org of orgs) {
                    const issuers = await contract.getVerifiersByOrganizationCode(org);
                    issuers.forEach(issuer => {
                        results.push({ issuer });
                    });
                }
                if (isMounted) {
                    setIssuers(results);
                }
            }
        };
        fetchOrg();
        return () => { isMounted = false; }; // Cleanup function to prevent state update on unmounted component
    }, [signer, contract]);

    // Second useEffect to check if the address is an issuer
    useEffect(() => {
        const checkIssuer = () => {
            const isAddressInIssuers = issuers.some(issuerObj => issuerObj.issuer === address);
            setIsIssuer(isAddressInIssuers);
        };
        checkIssuer();
    }, [address, issuers, isIssuer]);

    const filteredTickets = isIssuer ? tickets : tickets.filter(ticket => ticket.issuer_address === ' ');
    const notificationMessage = filteredTickets.length ? `You have ${filteredTickets.length} new notifications!` : 'No new notifications';

    return (
        <div>
            {address && (
                <>
                    <Tooltip title={notificationMessage}>
                        <IconButton
                            onClick={filteredTickets.length ? handleOpen : null}
                            anchorEl={anchorEl}>
                            <Badge badgeContent={filteredTickets.length} color="primary">
                                <NotificationsActiveIcon color="action" fontSize="large" />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                    <BasicMenu
                        open={open}
                        anchorEl={anchorEl}
                        handleClose={handleClose}
                        menuItems={filteredTickets}
                    />
                </>
            )}
        </div>
    );
};

export default NotificationBell;