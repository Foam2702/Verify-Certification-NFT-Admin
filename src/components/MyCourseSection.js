import "./CourseSection.css";

const MyCourseSection = ({ className = "" }) => {
    return (
        <section className={`header-section4 ${className}`}>

            <div className="new-header-container">
                <div className="new-header-content">
                    <div className="new-titles">
                        <img className="small-image" loading="lazy" src="/certificate examined.svg"></img>

                    </div>
                    <div className="new-approve-image">
                        <img
                            className="new-approve-image-icon"
                            loading="lazy"
                            alt=""
                            src="/How-to-create-an-online-course.jpg"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};


export default MyCourseSection;
