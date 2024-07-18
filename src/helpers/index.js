import axios from 'axios';
import { ec as EC } from 'elliptic';
import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';

const ec = new EC('secp256k1');
const JWT = process.env.REACT_APP_JWT; // Make sure to set this in your React app environment variables
export const minifyAddress = (address) => {
    if (address != null && address != '' && address != undefined) {
        const start = address.substring(0, 5);
        const end = address.substring(address.length - 4);
        return `${start}...${end}`;
    }
    return ""

};

export function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based in JavaScript
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}
export const deletePinIPFS = async (cid) => {
    try {
        const res = await axios.delete(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
            headers: {
                Authorization: `Bearer ${JWT}`
            }
        });
    } catch (error) {
        console.error(error);
    }

}
export const pinJSONToIPFS = async (ticket) => {

    const data = JSON.stringify({
        pinataContent: {
            name: `${ticket.owner_address}`,
            description: `${ticket.certificate_name}`,
            external_url: "https://pinata.cloud",
            image: `ipfs://${ticket.certificate_cid}`,
            attributes: [
                { "trait_type": "name", "value": `${ticket.name}` },
                { "trait_type": "citizen_id", "value": `${ticket.citizen_id}` },
                { "trait_type": "email", "value": `${ticket.email}` },
                { "trait_type": "dob", "value": `${ticket.dob}` },
                { "trait_type": "gender", "value": `${ticket.gender}` },
                { "trait_type": "region", "value": `${ticket.region}` },
                { "trait_type": "work_unit", "value": `${ticket.work_unit}` },
                { "trait_type": "point", "value": `${ticket.point ? ticket.point : ''}` },
                { "trait_type": "licensing_authority", "value": `${ticket.licensing_authority}` },
                { "trait_type": "issue_date", "value": `${ticket.issue_date}` },
                { "trait_type": "expiry_date", "value": `${ticket.expiry_date ? ticket.expiry_date : ''}` },
                { "trait_type": "status", "value": `${ticket.status}` },
            ]
        },
        pinataMetadata: {
            name: `metadata.json`
        }
    });

    try {
        const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", data, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${JWT}`
            }
        });
        return (res.data.IpfsHash);
    } catch (error) {
        console.log(error);
    }
};

export function replaceBaseUrl(ipfsLink, newBaseUrl) {
    const ipfsHash = ipfsLink.split('/').pop();
    return `${newBaseUrl}/ipfs/${ipfsHash}`;
}

export async function encryptData(data, senderPrivateKeyHex, receiverPublicKeyHex) {
    const senderPrivateKey = ec.keyFromPrivate(senderPrivateKeyHex, 'hex');
    const receiverPublicKey = ec.keyFromPublic(receiverPublicKeyHex, 'hex');

    const sharedKey = senderPrivateKey.derive(receiverPublicKey.getPublic()).toString(16); // Derive shared key
    const key = CryptoJS.SHA256(sharedKey).toString(CryptoJS.enc.Hex);

    const iv = CryptoJS.lib.WordArray.random(16); // Random IV
    const cipher = CryptoJS.AES.encrypt(data, CryptoJS.enc.Hex.parse(key), { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });

    return { cipher: cipher.toString(), iv: iv.toString() };
}


export async function decryptData(encryptedData, ivHex, senderPublicKeyHex, receiverPrivateKeyHex) {
    const receiverPrivateKey = ec.keyFromPrivate(receiverPrivateKeyHex, 'hex');
    const senderPublicKey = ec.keyFromPublic(senderPublicKeyHex, 'hex');
    const sharedKey = receiverPrivateKey.derive(senderPublicKey.getPublic()).toString(16); // Derive shared key
    const key = CryptoJS.SHA256(sharedKey).toString(CryptoJS.enc.Hex);

    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const decrypted = CryptoJS.AES.decrypt(encryptedData, CryptoJS.enc.Hex.parse(key), { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });

    return decrypted.toString(CryptoJS.enc.Utf8);
}
// export async function encryptData(data, publicKeyHex) {
//     const publicKey = ec.keyFromPublic(publicKeyHex, 'hex');
//     const fixedIV = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');

//     // Derive a shared secret using the public key
//     const sharedKey = publicKey.getPublic().encode('hex'); // using public key as shared key
//     const key = CryptoJS.SHA256(sharedKey).toString(CryptoJS.enc.Hex);

//     // Encrypt the data using AES-256-CBC with the fixed IV
//     const cipher = CryptoJS.AES.encrypt(data, CryptoJS.enc.Hex.parse(key), { iv: fixedIV, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });

//     return cipher.toString()
// }
// export async function decryptData(encryptedData, privateKeyHex) {
//     const fixedIV = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');
//     const iv = fixedIV.toString(CryptoJS.enc.Hex)

//     const privateKey = ec.keyFromPrivate(privateKeyHex, 'hex');
//     const publicKey = privateKey.getPublic();

//     // Derive the shared secret using the recipient's private key
//     const sharedKey = publicKey.encode('hex'); // using public key as shared key
//     const key = CryptoJS.SHA256(sharedKey).toString(CryptoJS.enc.Hex);

//     // Decrypt the data using AES-256-CBC with the fixed IV
//     const ivWordArray = CryptoJS.enc.Hex.parse(iv);
//     const decrypted = CryptoJS.AES.decrypt(encryptedData, CryptoJS.enc.Hex.parse(key), { iv: ivWordArray, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });

//     return decrypted.toString(CryptoJS.enc.Utf8);
// }

export async function imageFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsDataURL(file);
    });
}
export async function base64ToImageFile(base64String, filename = 'image.png') {
    // Split the base64 string in data and contentType
    const block = base64String.split(";");
    // Get the content type of the image
    const contentType = block[0].split(":")[1];
    // get the real base64 content of the file
    const realData = block[1].split(",")[1];
    // Convert it to a blob to upload
    const blob = b64toBlob(realData, contentType);
    // Create a FormData and append the file with "image" as parameter name
    const formDataToUpload = new FormData();
    formDataToUpload.append("image", blob, filename);
    return formDataToUpload;
}

function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}
// Now you can pass `base64ImageString` to `encryptData`
export function remove0x(input) {
    if (input.startsWith('0x')) {
        return input.slice(2);
    }
    return input;
}
export function add0x(input) {
    return "0x" + input
}
export function extractEncryptedDataFromJson(jsonString) {
    try {
        const obj = JSON.parse(jsonString);
        return {
            cipher: obj.cipher || 'Cipher not found',
            iv: obj.iv || 'IV not found'
        };
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return null;
    }
}

export async function fetchData(url) {
    try {
        const response = await axios.get(url);
        return response; // Process the response data as needed
    } catch (error) {
        handleError(error);
    }
}
export function handleError(error) {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error data:", error.response.data);
        console.error("Error status:", error.response.status);
        console.error("Error headers:", error.response.headers);
    } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
    } else if (error.isAxiosError) {
        // Error specific to axios request
        console.error("Axios error:", error.message);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
    }
}

export async function imageUpload(imageEnc, hashImg, owner, certificate) {
    const data = JSON.stringify({
        pinataContent: {
            name: owner,
            description: `${certificate}`,
            external_url: "https://pinata.cloud",
            image: imageEnc,
            hash: hashImg,


        },
        pinataMetadata: {
            name: `${owner}.json`
        }
    });

    try {
        const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", data, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${JWT}`
            }
        });
        return (res.data.IpfsHash);
    } catch (error) {
        console.log(error);
    }

}

export async function fetchImagePinata(imageHash) {
    try {
        const res = await axios(
            `https://api.pinata.cloud/data/pinList?hashContains=${imageHash}&status=pinned`,
            {
                headers: {
                    Authorization: `Bearer ${JWT}`,
                },
            }
        );

        return res.data.rows[0]
    }
    catch (err) {
        console.log(err)
    }

}

export function extractCID(url) {
    const cidPattern = /\/ipfs\/([a-zA-Z0-9]+)$/;
    const match = url.match(cidPattern);
    return match ? match[1] : null;
}
export function extractPinataCID(url) {
    const regex = /^ipfs:\/\/([a-zA-Z0-9]+)$/;
    const match = url.match(regex);
    if (match) {
        return match[1];
    }
    return null;
}
export function formatDateV2(dateString) {
    // Create a new Date object from the input string
    const date = new Date(dateString);
    console.log(dateString)

    // Define an array of month names
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Get the month name, day, and year from the Date object
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    // Return the formatted date string without the comma
    return `${month} ${day} ${year}`;
}
export function hashImage(imageBase64) {
    const imageWordArray = CryptoJS.enc.Base64.parse(imageBase64);

    // Hash the WordArray using SHA-256
    const hash = CryptoJS.SHA256(imageWordArray);

    // Convert the hash to a hexadecimal string
    const hexDigest = hash.toString(CryptoJS.enc.Hex);

    return (hexDigest)

}
export async function isExistsInPinata(hashImg) {

    try {
        const allCIDs = await axios(
            "https://api.pinata.cloud/data/pinList?status=pinned",
            {
                headers: {
                    Authorization: `Bearer ${JWT}`,
                },
            }
        );

        for (let cid of allCIDs.data.rows) {

            const imgHash = await axios(
                `https://coral-able-takin-320.mypinata.cloud/ipfs/${cid.ipfs_pin_hash}`

            );
            if (imgHash.data.hash == hashImg) {
                return true;
            }
        }

        return false
    }
    catch (err) {
        console.log(err)
        return err
    }
}

export const excelDateToJSDate = (excelDate) => {
    // Excel's epoch is January 1, 1900
    const excelEpoch = new Date(1900, 0, 1);
    // Subtract 1 day to account for Excel's leap year bug
    const jsDate = new Date(excelEpoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
    return jsDate;
};




