import MultiActionAreaCard from "../components/MultiACtionAreaCard";

const ExamSection = ({ course }) => {
    console.log("COURSE", course[0].name)
    return (
        <>

            <header className="header-container-exam">
                <div className="header-content">
                    <div className="titles">
                        <div className="title-1">{course[0].name}</div>
                        <div className="title-2">
                            {course[0].description}

                        </div>
                    </div>
                    <div className="person-image">
                        {/* <img
                        className="person-image-icon"
                        loading="lazy"
                        alt=""
                        src="/person-image@2x.png"
                    /> */}
                        <MultiActionAreaCard image={course[0].image} size={450} />

                    </div>
                </div>
            </header>

        </>

    )
}

export default ExamSection