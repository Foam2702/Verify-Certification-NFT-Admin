import { useMemo } from "react";
import "./Footer.css";

const Footer = ({
  shapeLeft,
  socialIcontwitter,
  footerDebugCommit,
  footerMarginTop,
}) => {
  const footerStyle = useMemo(() => {
    return {
      debugCommit: footerDebugCommit,
      marginTop: footerMarginTop,
    };
  }, [footerDebugCommit, footerMarginTop]);

  return (
    <footer className="footer" style={footerStyle}>
      <div className="footer-bottom">
        <div className="footer-bottom-background" />
        <img
          className="shape-left-icon"
          loading="lazy"
          alt=""
          src={shapeLeft}
        />
        <div className="footer-content">
          <div className="footer-columns">
            <div className="column-one">
              <div className="logo-info">

                <div className="company-info">
                  <h1 className="bespoke-software-solutions">
                    Verify-Certification-NFT
                  </h1>
                  <div className="social-iconfacebook-parent">
                    <img
                      className="social-iconfacebook"
                      loading="lazy"
                      alt=""
                      src="/socialiconfacebook.svg"
                    />
                    <img
                      className="social-iconyoutube"
                      loading="lazy"
                      alt=""
                      src="/socialiconyoutube@2x.png"
                    />
                    <img
                      className="social-iconinstagram"
                      loading="lazy"
                      alt=""
                      src="/socialiconinstagram.svg"
                    />
                    <img
                      className="social-icontwitter"
                      loading="lazy"
                      alt=""
                      src={socialIcontwitter}
                    />
                  </div>
                </div>
              </div>
              <div className="all-rights-reserved">
                © All rights reserved – VSCourses
              </div>
            </div>
            <div className="column-two">
              <div className="company-links">
                <div className="company">Company</div>
                <div className="about-us-parent">
                  <div className="about-us">About Us</div>
                  <div className="careers">Careers</div>
                  <div className="services">Services</div>
                  <div className="blog">Blog</div>
                </div>
              </div>
              <div className="connect-links">
                <div className="connect">Connect</div>
                <div className="hifinsweetcom-parent">
                  <div className="hifinsweetcom">vscourses@gmail.com</div>
                  <div className="contact">+(123) 456-7890</div>
                </div>
              </div>
            </div>
            <div className="column-three">
              <div className="newsletter">
                <div className="newsletter-form">
                  <div className="join-newsletter">Join Newsletter</div>
                  <div className="newsletter-input">
                    <input
                      className="input"
                      placeholder="Type email here"
                      type="text"
                    />
                    <button className="button1">
                      <div className="bg" />
                      <div className="subscribe">Subscribe</div>
                    </button>
                  </div>
                </div>
              </div>
              <div className="legal">
                <div className="privacy-policy">Privacy Policy</div>
                <div className="terms-conditions">{`Terms & Conditions`}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="shape-right-wrapper">
          <div className="shape-right" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
