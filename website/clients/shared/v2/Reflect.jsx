import { Link } from 'react-router-dom';
import { ExpertisePath } from '../rewards.jsx';
import { useNavigate } from 'react-router-dom';
export default function Reflect({ progress }) {
  const navigate = useNavigate();
  return <div className="page"><header className="page-head"><div><h1>See what’s taking shape.</h1><p className="sub">Use your answers to decide what deserves another look.</p></div></header><div className="reflect-paths">
    <Link to="/notebook"><span>Review & recall</span><h2>Make your mistakes useful.</h2><p>Revisit the answer, find the reason, and try the method again when it’s due.</p><strong>Open mistake notebook →</strong></Link>
    <Link to="/summary"><span>Your week</span><h2>Notice the progress.</h2><p>Review completed sessions, recurring difficulties and what improved.</p><strong>See weekly reflection →</strong></Link>
    <Link to="/results"><span>Marked work</span><h2>Follow the feedback.</h2><p>Open your saved papers, marks, worked solutions and question-by-question feedback.</p><strong>Review paper results →</strong></Link>
  </div><section className="learning-invitation"><h2>Your evidence, in context.</h2><Link to="/learn">Topic evidence map →</Link><Link to="/insights">Detailed subject progress →</Link></section><ExpertisePath progress={progress} onChooseLesson={() => navigate('/learn')}/></div>;
}
