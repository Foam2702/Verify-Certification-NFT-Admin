import "./VerifySection.css";

const LisenceSection = ({ className = "" }) => {
    return (
        <div className={`new-header-container  ${className}`}>
            <div className="new-header-content">
                <div className="new-titles">
                    <img className="small-image" loading="lazy" src="/your certificates.svg"></img>

                </div>
                <div className="new-approve-image">
                    <img
                        className="new-approve-image-icon"
                        loading="lazy"
                        alt=""
                        src="/blog_header_what_is_a_certificate_0.jpg"
                    />
                </div>
            </div>
        </div>
    );
};


export default LisenceSection;
