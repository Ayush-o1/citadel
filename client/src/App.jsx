import { Routes, Route } from 'react-router-dom';
import { RoleProvider, ROLES } from './app/RoleContext.jsx';
import RoleGate from './app/RoleGate.jsx';
import AppShell from './components/layout/AppShell.jsx';
import Entry from './pages/Entry.jsx';
import Discover from './pages/customer/Discover.jsx';
import EquipmentDetail from './pages/customer/EquipmentDetail.jsx';
import MyRentals from './pages/customer/MyRentals.jsx';
import ControlTower from './pages/dealer/ControlTower.jsx';
import AssetDashboard from './pages/dealer/AssetDashboard.jsx';
import FleetOverview from './pages/admin/FleetOverview.jsx';
import Utilization from './pages/admin/Utilization.jsx';
import Capacity from './pages/admin/Capacity.jsx';
import Anomalies from './pages/admin/Anomalies.jsx';
import Forecasts from './pages/admin/Forecasts.jsx';
import Recommendations from './pages/admin/Recommendations.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <RoleProvider>
      <Routes>
        <Route path="/" element={<Entry />} />

        <Route element={<RoleGate allow={[ROLES.CUSTOMER]} />}>
          <Route element={<AppShell />}>
            <Route path="/customer" element={<Discover />} />
            <Route path="/customer/equipment/:id" element={<EquipmentDetail />} />
            <Route path="/customer/rentals" element={<MyRentals />} />
          </Route>
        </Route>

        <Route element={<RoleGate allow={[ROLES.DEALER]} />}>
          <Route element={<AppShell />}>
            <Route path="/dealer" element={<ControlTower />} />
            <Route path="/dealer/assets" element={<AssetDashboard />} />
          </Route>
        </Route>

        <Route element={<RoleGate allow={[ROLES.ADMIN]} />}>
          <Route element={<AppShell />}>
            <Route path="/admin" element={<FleetOverview />} />
            <Route path="/admin/utilization" element={<Utilization />} />
            <Route path="/admin/capacity" element={<Capacity />} />
            <Route path="/admin/anomalies" element={<Anomalies />} />
            <Route path="/admin/forecasts" element={<Forecasts />} />
            <Route path="/admin/recommendations" element={<Recommendations />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </RoleProvider>
  );
}
