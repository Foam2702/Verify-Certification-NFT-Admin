import * as React from 'react';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import { CardActionArea, Button } from '@mui/material';
import Link from '@mui/material/Link';
import axios from 'axios';
import DownloadIcon from '@mui/icons-material/Download'; // Import the download icon

export default function MultiActionAreaCard({ image, size, download = false }) {
    const encrypt_image = "/encrypted_image.jpg";
    const [currentImage, setCurrentImage] = React.useState(null);
    const handleError = () => {
        setCurrentImage(encrypt_image);
    };
    React.useEffect(() => {
        const fetchImage = async () => {
            try {
                if (image) { // This checks for undefined, null, and empty string
                    setCurrentImage(image);
                } else {
                    setCurrentImage(encrypt_image);
                }
            } catch (err) {
                console.log(err);
            }
        };
        fetchImage();
    }, [image]);
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = currentImage;
        link.download = 'DownloadedImage'; // You can set the default name of the downloaded file here
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    // If currentImage is not set or is an empty string, don't display anything
    if (!currentImage) {
        return null; // or return <></> for an empty fragment
    }

    return (
        <div>
            <Card sx={{ width: size }}>
                <Link href={currentImage} target="_blank">
                    <CardActionArea>
                        <CardMedia
                            component="img"
                            height="140"
                            image={currentImage}
                            alt="green iguana"
                            onError={handleError}
                        />
                    </CardActionArea>
                </Link>
                {download && <Button
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    sx={{ margin: 1, fontSize: '1.5rem' }}
                >
                    Download
                </Button>}

            </Card>
        </div>
    );
}