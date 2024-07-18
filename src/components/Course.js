import "./Course.css";
import PropTypes from 'prop-types';

const Course = ({ className = "", course1Image, courseHeader, courseDescription, courseOrg
  , courseOrgImg }) => {
  const imagenotfound = "/imagenotfound.png"
  return (
    <div className={`course-1 ${className}`}>
      <img
        className="course-1-image"
        loading="lazy"
        alt=""
        src={course1Image || imagenotfound}
      />
      <div className="background-parent">
        <div className="background" />
        <div className="org">
          <img
            className="org-image"
            loading="lazy"
            alt=""
            src={courseOrgImg}
          />
          <h5 className='org-name'>{courseOrg}</h5>

        </div>
        <h3 className="course-header">{courseHeader}</h3>
        <div className="lorem-ipsum-dolor-sit-amet-co-parent">
          <p className="lorem-ipsum-dolor3">
            {courseDescription}
          </p>

        </div>
      </div>
    </div>
  );
};

Course.propTypes = {
  className: PropTypes.string,
  course1Image: PropTypes.string,
  courseHeader: PropTypes.string,
};

export default Course;
