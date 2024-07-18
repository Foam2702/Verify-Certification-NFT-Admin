import "./CourseSection.css";

const CourseSection = ({ className = "" }) => {
  return (
    <section className={`header-section4 ${className}`}>

      <div className="new-header-container">
        <div className="new-header-content">
          <div className="new-titles">
            <img className="small-image" loading="lazy" src="/trending certificates.svg"></img>

          </div>
          <div className="new-approve-image">
            <img
              className="new-approve-image-icon"
              loading="lazy"
              alt=""
              src="/Best-online-course-platforms.webp"
            />
          </div>
        </div>
      </div>
    </section>
  );
};


export default CourseSection;
