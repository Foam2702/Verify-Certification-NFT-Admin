import RowRadioButtonsGroup from "../components/RowRadioButtonGroup";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from 'react-router-dom';
import ExamSection from "../components/ExamSection";
import useSigner from "../state/signer";
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from "react-router-dom";

const Exam = () => {
    const [exams, setExams] = useState([])
    const [course, setCourse] = useState(null)
    const { id } = useParams();
    const { address, signer, connectWallet, contract } = useSigner();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const result = await axios(`https://verify-certification-nft-production.up.railway.app/courses/course/${id}/exam`)
                setExams(result.data.exams)

            }
            catch (err) {
                console.log(err)
            }

        }
        fetchExam()
        const fetchCourse = async () => {
            try {
                const result = await axios(`https://verify-certification-nft-production.up.railway.app/courses/course/${id}`)
                setCourse(result.data.course)
            }
            catch (err) {
                console.log(err)
            }

        }
        fetchCourse()
        const check = async () => {
            setLoading(true); // Start loading
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
                    const issuer = results.find((issuer) => issuer.issuer === address);
                    if (issuer) {
                        navigate("/");

                    }
                }

                const result = await axios(`https://verify-certification-nft-production.up.railway.app/exam/${id}?address=${address}`)
                console.log(result)
                if (result.data.data[0].status == "examining") {
                    setTimeout(() => {
                        if (!address)
                            navigate("/");
                        setLoading(false);
                    }, 1000);
                }
                else {
                    navigate("/");
                }
            }
            catch (err) {
                console.log(err)
                setLoading(false);
                navigate("/")
            }

        }
        check()
    }, [id])

    return (
        <>
            {loading && (
                <div className="loading-overlay">
                    <CircularProgress />
                </div>
            )}
            {course && exams &&
                <>
                    {/* <HeaderExam /> */}
                    <ExamSection course={course} />
                    <RowRadioButtonsGroup
                        course={course}
                        exam={exams}
                    />
                    {/* <Footer
                        shapeLeft="/shape-left@2x.png"
                        socialIcontwitter="/socialicontwitter@2x.png"
                    /> */}
                </>
            }

        </>
    )
}
export default Exam