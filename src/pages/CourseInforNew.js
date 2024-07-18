import TopHeader from "../components/TopHeader";
import HeaderContainer from "../components/HeaderContainer";
import BodyButtons from "../components/BodyButtons";
import HeaderSection from "../components/HeaderSection";
import MyCourseSection from "../components/MyCourseSection";
import "./CourseInforNew.css";

const CourseInforNew = () => {
  return (
    <div className="courseinfornew">
      <section className="header-section-group">
        <div className="header-section1">
          <HeaderSection />
          <MyCourseSection />
        </div>
        <div className="body-header-container">
          <div className="body-header1">
            <h1 className="body-header-text3">List of Certificates</h1>
          </div>
        </div>
        {/* <div className="upload-container">
          <div className="upload1">
            <h3 className="course-name">Course</h3>
            <h3 className="course-infor">Infor here:</h3>
            <div className="link-to">Link to Transactions</div>
          </div>
        </div> */}
      </section>
      <BodyButtons />
    </div>
  );
};

export default CourseInforNew;
