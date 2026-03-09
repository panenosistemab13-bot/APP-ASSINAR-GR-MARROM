import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AdminDashboard } from './components/AdminDashboard';
import { DriverSignature } from './components/DriverSignature';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/sign/:id" element={<DriverSignature />} />
      </Routes>
    </Router>
  );
}
