import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { DesignReviewPage } from './pages/DesignReviewPage';
import { LessonsPage } from './pages/LessonsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/designs/:id" element={<DesignReviewPage />} />
          <Route path="/lessons" element={<LessonsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
