import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ControlTower from './pages/ControlTower.jsx';
import AssetDashboard from './pages/AssetDashboard.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ControlTower />} />
        <Route path="/assets" element={<AssetDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
