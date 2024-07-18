import { Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react'
//import Vertifications from "./Vertifications";
import axios from "axios";
import HeaderSection from "../components/HeaderSection";
import Footer from "../components/Footer";
import VerifySection from '../components/VerifySection';
import useSigner from "../state/signer";

//import FooterTop from "../components/FooterTop";
//import "./Vertifications.css";
import Ticket from '../components/Ticket';
import { useNavigate } from "react-router-dom";

export default function VerificationForIssuer() {
    const { signer, loading, address, connectWallet, getPublicKey } = useSigner();

    const [ticket, setTicket] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTicketsById = async () => {
            if (address) {
                try {
                    const result = await axios(`https://verify-certification-nft-production.up.railway.app/tickets/ticket/${id}?address=${address}`);
                    if (result.data.message === "ticket doesn't exist" || result.data.ticket.length == 0) {
                        navigate("/");
                    } else {
                        result.data.ticket.forEach(item => {
                            if (item.owner_address === address) {
                                if (item.issuer_address === ' ') {
                                    setTicket(item)
                                }
                            }
                            else if (item.issuer_address === address) {
                                setTicket(item)
                            }

                        })
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        };
        fetchTicketsById();
    }, [id, address, navigate]);
    return (

        <div >
            <HeaderSection />
            <VerifySection />

            <Ticket
                ticket={ticket}
            />

            <Footer
                shapeLeft="/shape-left1.svg"
                socialIcontwitter="/socialicontwitter1.svg"
                footerDebugCommit="unset"
                footerMarginTop="unset"
            />

        </div>
    );
}