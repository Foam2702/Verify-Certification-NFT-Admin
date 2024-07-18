import "./AddIssuerSection.css";

const AddIssuerSection = ({ className = "" }) => {

    return (
        <div className={`new-header-container ${className}`}>
            <div className="new-header-content">
                <div className="new-titles">
                    <img className="small-image" loading="lazy" src="/admin.svg"></img>

                </div>
                <div className="new-approve-image">
                    <img
                        className="new-approve-image-icon"
                        loading="lazy"
                        alt=""
                        src="/admin-worker-vector.webp"
                    />
                </div>
            </div>
        </div>
    );
};


export default AddIssuerSection;
