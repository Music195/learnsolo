import React from 'react'
import { Link } from 'react-router'
import '../styles/footer.css'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* About LearnSolo & Creator */}
        <div className="footer-col footer-about">
          <Link className="footer-brand" to="/">
            <img src="/static/logo.png" alt="Learn Solo Logo" className="footer-logo" />
            <span>Learn Solo</span>
          </Link>
          <p className="footer-desc">
            An interactive study platform for Japanese High-School Mathematics & Physics,
            Grade 12 Myanmar curriculum, and authentic JLPT Japanese Mock Tests.
          </p>
          <div className="footer-creator">
            <a
              href="https://music195.github.io/portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="creator-link"
              title="Creator Portfolio & About Me"
            >
              <i className="fas fa-user-astronaut"></i> <strong>About Me (Portfolio)</strong>
            </a>
            <a
              href="https://github.com/Music195/learnsolo"
              target="_blank"
              rel="noopener noreferrer"
              className="creator-gh"
              title="GitHub Repository"
            >
              <i className="fab fa-github"></i> GitHub
            </a>
          </div>
        </div>

        {/* Subjects & Notes */}
        <div className="footer-col">
          <h4>Subjects & Notes</h4>
          <ul>
            <li><Link to="/#subjects">Mathematics (I, II, III, A, B, C)</Link></li>
            <li><Link to="/#subjects">Physics (Mechanics, Waves, Electromagnetism)</Link></li>
            <li><Link to="/#subjects">Grade 12 Myanmar (Math & Physics)</Link></li>
            <li><Link to="/practice">Topic Practice Sets</Link></li>
          </ul>
        </div>

        {/* Mock Questions */}
        <div className="footer-col">
          <h4>Mock Questions</h4>
          <ul>
            <li><Link to="/past/jlpt">JLPT Mock Tests (N1 to N5)</Link></li>
            <li><Link to="/past/eju">EJU Mock Papers (Course 1 & 2)</Link></li>
            <li><Link to="/past/university">University Mock Questions</Link></li>
            <li><Link to="/past">All Mock Exams</Link></li>
          </ul>
        </div>

        {/* Quick Links & Developer */}
        <div className="footer-col">
          <h4>Connect & Account</h4>
          <ul>
            <li><Link to="/account">My Account & Progress</Link></li>
            <li><Link to="/login">Sign In / Register</Link></li>
            <li>
              <a
                href="https://music195.github.io/portfolio/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Developer Portfolio <i className="fas fa-arrow-up-right-from-square" style={{ fontSize: '0.75rem' }}></i>
              </a>
            </li>
            <li>
              <a href="mailto:minthetkhine195@gmail.com">
                Contact Developer
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>© {new Date().getFullYear()} Learn Solo. Free interactive education for curious minds.</p>
          <p className="footer-credit">
            Created with ❤️ by <a href="https://music195.github.io/portfolio/" target="_blank" rel="noopener noreferrer">Music195</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
