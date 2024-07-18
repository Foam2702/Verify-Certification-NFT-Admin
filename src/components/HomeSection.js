const HomeSection = () => {
    return (
        <header className="header-container">
            <div className="header-content">
                <div className="titles">
                    {/* <h1 className="title-1"> Verify SBT Courses</h1> */}
                    <img className="small-image" loading="lazy" src="./vscourses2.svg"></img>

                </div>
                <div className="person-image">
                    <img
                        className="person-image-icon"
                        loading="lazy"
                        alt=""
                        src="/soulbound-token-development (1).jpg"
                    />
                </div>
            </div>
        </header>
    )
}

export default HomeSection;