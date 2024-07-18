import "./BodyButtons.css";
import PropTypes from 'prop-types';

const BodyButtons = ({ className = "" }) => {
  return (
    <section className={`body-buttons ${className}`}>
      {/* <div className="body-button2">
        <button className="next-button1">
          <b className="next1">Next</b>
        </button>
      </div> */}
      <footer className="footer3">
        <div className="footer-bottom3">
          <div className="footer-bottom-background3" />
          <img
            className="shape-left-icon3"
            loading="lazy"
            alt=""
            src="/shape-left1.svg"
          />
          <div className="footer-content-left">
            <div className="footer-content-left-top">
              <div className="footer-content-left-top-first">
                <div className="logo-group">
                  <img
                    className="logo-icon3"
                    loading="lazy"
                    alt=""
                    src="/logo.svg"
                  />
                  <div className="bespoke-software-solutions-group">
                    <h1 className="bespoke-software-solutions3">
                      Bespoke software solutions
                    </h1>
                    <div className="social-icons">
                      <img
                        className="social-iconfacebook3"
                        loading="lazy"
                        alt=""
                        src="/socialiconfacebook.svg"
                      />
                      <img
                        className="social-iconyoutube3"
                        loading="lazy"
                        alt=""
                        src="/socialiconyoutube@2x.png"
                      />
                      <img
                        className="social-iconinstagram3"
                        loading="lazy"
                        alt=""
                        src="/socialiconinstagram.svg"
                      />
                      <img
                        className="social-icontwitter3"
                        loading="lazy"
                        alt=""
                        src="/socialicontwitter1.svg"
                      />
                    </div>
                  </div>
                </div>
                <div className="all-rights-reserved3">
                  © All rights reserved – Finsweet
                </div>
              </div>
              <div className="footer-content-left-bottom">
                <div className="company-group">
                  <b className="company3">Company</b>
                  <div className="company-links1">
                    <div className="about-us3">About Us</div>
                    <div className="careers3">Careers</div>
                    <div className="services3">Services</div>
                    <div className="blog3">Blog</div>
                  </div>
                </div>
                <div className="connect-group">
                  <b className="connect3">Connect</b>
                  <div className="contact-info">
                    <div className="hifinsweetcom3">hi@finsweet.com</div>
                    <div className="contact-details">+(123) 456-7890</div>
                  </div>
                </div>
              </div>
              <div className="newsletter-content-parent">
                <div className="newsletter-content">
                  <div className="newsletter-sign-up">
                    <b className="join-newsletter3">Join Newsletter</b>
                    <div className="newsletter-form1">
                      <input
                        className="input3"
                        placeholder="Type email here"
                        type="text"
                      />
                      <button className="button8">
                        <div className="bg3" />
                        <b className="subscribe3">Subscribe</b>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="privacy-policy-group">
                  <div className="privacy-policy3">Privacy Policy</div>
                  <div className="terms-conditions3">{`Terms & Conditions`}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-shape-right">
            <div className="shape-right3" />
          </div>
        </div>
      </footer>
    </section>
  );
};


export default BodyButtons;
