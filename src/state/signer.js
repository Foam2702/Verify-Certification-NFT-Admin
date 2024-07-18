import { createContext, useContext, useState, useEffect } from 'react';
import Web3Modal from 'web3modal';
import { useNavigate } from "react-router-dom";
import SOULBOUND from "../artifacts/contracts/SoulboundToken.sol/SoulboundToken.json";
import { Buffer } from 'buffer'
const { ethers } = require("ethers");
const SOULBOUND_ADDRESS = process.env.REACT_APP_SOULBOUND_ADDRESS;

let SignerContext = createContext();
const useSigner = () => useContext(SignerContext);
export const SignerProvider = ({ children }) => {
    const navigate = useNavigate();

    const [signer, setSigner] = useState(null);
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [contract, setContract] = useState(null);
    const [provider, setProvider] = useState(null);

    useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            const web3modal = new Web3Modal();
            if (web3modal.cachedProvider) {
                connectWallet();
            }

            window.ethereum.on("accountsChanged", (accounts) => {
                if (accounts.length === 0) {
                    setAddress(null);
                    setSigner(null);
                    setProvider(null);
                    setContract(null);
                    console.log("No accounts connected");
                    // Navigate to login or show a message to the user
                    navigate("/login"); // Change "/login" to your login route
                } else {
                    connectWallet();
                }
            });
        } else {
            console.error("MetaMask is not installed");
        }
    }, []);

    const connectWallet = async () => {
        setLoading(true);
        try {
            const web3modal = new Web3Modal({ cacheProvider: true });
            const instance = await web3modal.connect();
            const provider = new ethers.providers.Web3Provider(instance);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const newContract = new ethers.Contract(SOULBOUND_ADDRESS, SOULBOUND.abi, signer);

            setContract(newContract);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSigner(signer);
            setAddress(address);
            setProvider(provider);

            // Set up event listener for Transfer events
            if (newContract) {
                newContract.on("Transfer", (from, to, tokenId, event) => {
                    console.log(`NFT Transfer detected: From ${from} to ${to} TokenID ${tokenId.toString()}`);
                    console.log(event);
                    if (from === address) {
                        console.log("Owner initiated transfer detected.");
                    } else {
                        console.log("Transfer by non-owner detected.");
                    }
                });
            }
        } catch (e) {
            console.error("Error connecting wallet:", e);
            setAddress(null);
            setSigner(null);
            setProvider(null);
            setContract(null);
        }
        setLoading(false);
    };
    async function getPublicKey() {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []); // Yêu cầu kết nối với Metamask
            const signer = provider.getSigner();
            // Tạo một thông điệp ngẫu nhiên để ký
            const message =
                `Welcome to VSCourses! \n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address: ${address}`;

            const signature = await signer.signMessage(message);

            // Từ chữ ký, lấy ra public key
            const publicKey = ethers.utils.recoverPublicKey(ethers.utils.hashMessage(message), signature);
            return publicKey;
        } catch (err) {
            console.log(err)
            return (err)
        }
    }

    const contextValue = { provider, contract, signer, loading, address, connectWallet, getPublicKey };
    return (
        <SignerContext.Provider value={contextValue}>
            {children}
        </SignerContext.Provider>
    );
};

export default useSigner;
