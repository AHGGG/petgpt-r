import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import 'tailwindcss/tailwind.css';

function Hello() {
  return (
    <div className="text-center border-solid border-4 border-red-500 bg-black text-white shadow">
      ERB + TAILWIND = ❤
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
