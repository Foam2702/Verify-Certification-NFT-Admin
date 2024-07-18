import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import AddressAvatar from './AddressAvatar';
import CircularProgress from '@mui/material/CircularProgress';
import useSigner from "../state/signer";

import "./BasicMenu.css"

export default function BasicMenu({ anchorEl, handleClose, open, menuItems }) {
    const [loading, setLoading] = useState(false);
    const [isExam, setIsExam] = useState(false)
    const { address } = useSigner();

    const navigate = useNavigate();
    const handleItemClick = async (newItem) => {
        try {
            if (newItem) {
                setLoading(true);
                await new Promise(resolve => setTimeout(resolve, 500)); // wait for 2 seconds
                setLoading(false);
                navigate(`/tickets/ticket/${newItem.id}`);
                handleClose();
            }
            else {
                return
            }

        }
        catch (err) {
            console.log(err)
        }

    };

    return (

        <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
                'aria-labelledby': 'basic-button',
            }}
            sx={{
                maxHeight: '700px',  // Adjust this value as needed
                overflow: 'auto',
            }}
        >
            {menuItems.map((item, index) => {
                if (item.status === "processing" || item.status === "reject" || item.status === 'approved') {
                    return (
                        <>
                            {
                                item.owner_address === address ? (
                                    <MenuItem key={index}
                                        style={{
                                            fontSize: '20px',
                                            padding: '10px',
                                            width: '500px',
                                            marginBottom: '10px',
                                        }}
                                        onClick={() => handleItemClick(item)}
                                    >
                                        <Typography style={{ marginRight: '10px' }}>
                                            <>
                                                {item.status === "processing" && (
                                                    <>
                                                        <span style={{ "margin": "5px", "fontWeight": "bold" }}>
                                                            <AddressAvatar address={item.licensing_authority} />
                                                        </span>
                                                        <span className="yellow-text">is reviewing</span>
                                                        <span style={{ "margin": "5px", "fontWeight": "bold" }}>
                                                            {item.certificate_name}
                                                        </span>
                                                    </>
                                                )}
                                                {item.status === "reject" && (
                                                    <>
                                                        <span style={{ "margin": "5px", "fontWeight": "bold" }}>
                                                            <AddressAvatar address={item.licensing_authority} />
                                                        </span>
                                                        <span className="red-text">refused to validate</span>
                                                        <span style={{ "margin": "5px", "fontWeight": "bold" }}>
                                                            {item.certificate_name}
                                                        </span>
                                                    </>
                                                )}
                                                {item.status === "approved" && (
                                                    <>
                                                        <span style={{ "margin": "5px", "fontWeight": "bold" }}>
                                                            <AddressAvatar address={item.licensing_authority} />
                                                        </span>
                                                        <span className="green-text">has mint soulbound for</span>
                                                        <span style={{ "margin": "5px", "fontWeight": "bold" }}>
                                                            {item.certificate_name}
                                                        </span>
                                                    </>
                                                )}
                                            </>
                                        </Typography>
                                    </MenuItem>
                                ) : (

                                    item.status === "processing" && (
                                        <MenuItem style={{
                                            fontSize: '20px',
                                            padding: '10px',
                                            width: '500px',
                                            marginBottom: '10px',
                                        }}
                                            onClick={() => handleItemClick(item)}
                                        >
                                            <Typography style={{ marginRight: '10px' }}>

                                                <>
                                                    <span style={{ fontWeight: "bold" }}>
                                                        <AddressAvatar address={item.owner_address} />
                                                    </span>
                                                    <span className="yellow-text">requires certificate authentication</span>
                                                    <span style={{ "margin": "5px", "fontWeight": "bold" }}>
                                                        {item.certificate_name}
                                                    </span>
                                                </>
                                            </Typography>
                                        </MenuItem>
                                    )
                                )
                            }
                        </>);
                }
            })}
            {
                loading && (
                    <div className="loading-overlay">
                        <CircularProgress />
                    </div>
                )
            }
        </Menu >
    );
}
