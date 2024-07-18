import "./FeauresSection.css";
import axios from "axios";
import { useEffect, useState } from 'react';
import Course from "./Course";
import { Link } from "@mui/material";
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import useSigner from "../state/signer";

const FeauresSection = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false)
  const { signer, address, connectWallet, getPublicKey } = useSigner()
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const result = await axios.get(`https://verify-certification-nft-production.up.railway.app/courses/top10`);
        console.log("RES", result.data.courses);

        if (Array.isArray(result.data.courses)) {
          setCourses(result.data.courses);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchCourses();
  }, []);
  const handleCourseClick = async () => {
    setLoading(true); // Start loading
    const checkPub = await insertPubToDB()
    if (!address) {
      navigate("/");
    }
    else if (!checkPub) {
      navigate("/");
    }
    else {
      navigate("/coursetransfernew");
    }
    setLoading(false);

  }
  const insertPubToDB = async () => {
    if (address) {
      try {
        const checkPublicKeyExisted = await axios.get(`https://verify-certification-nft-production.up.railway.app/addresses/${address}`);
        if (checkPublicKeyExisted.data.address.length === 0) {
          const publicKey = await getPublicKey(); // Await the result of getPublicKey
          if (publicKey.code === 4001 && publicKey.message === "User rejected the request.") {
            return false
          }
          await axios.post(`https://verify-certification-nft-production.up.railway.app/addresses/${address}`, {
            address: address, // Include the address in the body
            publicKey: publicKey // Include the public key in the body
          });
          return true
        }
        else if (checkPublicKeyExisted.data.address.length !== 0) {
          if (checkPublicKeyExisted.data.address[0].publickey == null) {
            const publicKey = await getPublicKey(); // Await the result of getPublicKey
            if (publicKey.code === 4001 && publicKey.message === "User rejected the request.") {

              return false
            }
            await axios.post(`https://verify-certification-nft-production.up.railway.app/addresses/${address}`, {
              address: address, // Include the address in the body
              publicKey: publicKey // Include the public key in the body
            });

            return true
          }
        }
        return true
      }
      catch (err) {
        console.log(err)
        return false
      }
    }
  };
  // Duplicate courses to create an infinite loop effect
  const duplicatedCourses = [...courses, ...courses];

  return (
    //feaures-section
    <div className="feaures-section">
      {loading && (
        <div className="loading-overlay">
          <CircularProgress />
        </div>
      )}
      <div className="body-header-2">
        <div>Most Popular Certificates</div>
        {/* <Link sx={{
          fontSize: "var(--font-size-10xl)",
          boxSizing: "border-box",
        }}>See all</Link> */}
      </div>
      <div className="list-courses">
        {duplicatedCourses.map((course, index) => (
          <div className="course" key={`${course.id}-${index}`}>
            <button className="course-background" onClick={handleCourseClick}>

              <Course
                course1Image={course.image}
                courseHeader={course.name}
                courseOrg={course.licensing_authority}
                courseOrgImg={course.image_licensing_authority}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeauresSection;
