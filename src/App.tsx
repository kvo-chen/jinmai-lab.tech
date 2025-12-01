import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from 'react'
import Home from "@/pages/Home";
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Explore = lazy(() => import("@/pages/Explore"));
const WorkDetail = lazy(() => import("@/pages/WorkDetail"));
const Create = lazy(() => import("@/pages/Create"));
const Admin = lazy(() => import("@/pages/admin/Admin"));
const ErrorMonitoringDashboard = lazy(() => import("@/components/ErrorMonitoringDashboard"));
const Tools = lazy(() => import("@/pages/Tools"));
const About = lazy(() => import("@/pages/About"));
const Terms = lazy(() => import("@/pages/Terms"));
const Help = lazy(() => import("@/pages/Help"));
const BrandGuide = lazy(() => import("@/pages/BrandGuide"));
const InputHub = lazy(() => import("@/pages/InputHub"));
const Generation = lazy(() => import("@/pages/Generation"));
const Authenticity = lazy(() => import("@/pages/Authenticity"));
const Square = lazy(() => import("@/pages/Square"));
const Community = lazy(() => import("@/pages/Community"));
const Incentives = lazy(() => import("@/pages/Incentives"));
const AdminAnalytics = lazy(() => import("@/pages/AdminAnalytics"));
const Wizard = lazy(() => import("@/pages/Wizard"));
const Neo = lazy(() => import("@/pages/Neo"));
const Settings = lazy(() => import("@/pages/Settings"));
const Analytics = lazy(() => import("@/pages/Analytics"));
import PrivateRoute from "@/components/PrivateRoute";
import AdminRoute from "@/components/AdminRoute";
const CulturalKnowledge = lazy(() => import("@/pages/CulturalKnowledge"));
const TianjinCreativeActivities = lazy(() => import('@/components/TianjinCreativeActivities'))
const DailyCheckin = lazy(() => import("@/components/DailyCheckin"));
const CreativeMatchmaking = lazy(() => import("@/components/CreativeMatchmaking"));
const IPIncubationCenter = lazy(() => import("@/components/IPIncubationCenter"));
const CrossDeviceSync = lazy(() => import("@/components/CrossDeviceSync"));
const AchievementMuseum = lazy(() => import("@/components/AchievementMuseum"));
const Drafts = lazy(() => import("@/pages/Drafts"));
const Lab = lazy(() => import("@/pages/Lab"));
const BlindBoxShop = lazy(() => import("@/components/BlindBoxShop"));

export default function App() {
  return (
    <Suspense fallback={<div className="p-4">加载中...</div>}>
      <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/explore/:id" element={<WorkDetail />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/help" element={<Help />} />
          <Route path="/neo" element={<Neo />} />
          <Route path="/lab" element={<PrivateRoute component={Lab} />} />
          <Route path="/wizard" element={<PrivateRoute component={Wizard} />} />
          <Route path="/brand" element={<PrivateRoute component={BrandGuide} />} />
          <Route path="/input" element={<PrivateRoute component={InputHub} />} />
          <Route path="/generate" element={<PrivateRoute component={Generation} />} />
          <Route path="/authenticity" element={<PrivateRoute component={Authenticity} />} />
          <Route path="/square" element={<PrivateRoute component={Square} />} />
          <Route path="/square/:id" element={<PrivateRoute component={Square} />} />
          <Route path="/community" element={<PrivateRoute component={Community} />} />
          <Route path="/incentives" element={<PrivateRoute component={Incentives} />} />
          
          {/* 需要登录的路由 */}
          <Route 
            path="/dashboard" 
            element={<PrivateRoute component={Dashboard} />} 
          />

          <Route 
            path="/create" 
            element={<PrivateRoute component={Create} />} 
          />

          <Route 
            path="/drafts" 
            element={<PrivateRoute component={Drafts} />} 
          />

          <Route 
            path="/settings" 
            element={<PrivateRoute component={Settings} />} 
          />
          
          <Route 
            path="/analytics" 
            element={<PrivateRoute component={Analytics} />} 
          />
          
          <Route 
            path="/knowledge" 
            element={<PrivateRoute component={CulturalKnowledge} />} 
          />
          
          <Route 
            path="/knowledge/:type/:id" 
            element={<PrivateRoute component={CulturalKnowledge} />} 
          />
          
          {/* 天津特色专区路由 */}
          <Route 
            path="/tianjin" 
            element={<PrivateRoute component={TianjinCreativeActivities} />} 
          />
          
          {/* 创新功能路由 */}
          <Route 
            path="/daily-checkin" 
            element={<PrivateRoute component={DailyCheckin} />} 
          />
          
          <Route 
            path="/creative-matchmaking" 
            element={<PrivateRoute component={CreativeMatchmaking} />} 
          />
          
          <Route 
            path="/ip-incubation" 
            element={<PrivateRoute component={IPIncubationCenter} />} 
          />
          
          <Route 
            path="/cross-device-sync" 
            element={<PrivateRoute component={CrossDeviceSync} />} 
          />
          
          <Route 
            path="/achievement-museum" 
            element={<PrivateRoute component={AchievementMuseum} />} 
          />
          
          <Route 
            path="/blind-box" 
            element={<PrivateRoute component={BlindBoxShop} />} 
          />
          
          {/* 管理员路由 */}
          <Route 
            path="/admin" 
            element={<AdminRoute component={Admin} />} 
          />
          <Route 
            path="/errors" 
            element={<AdminRoute component={ErrorMonitoringDashboard} />} 
          />
          <Route 
            path="/admin-analytics" 
            element={<AdminRoute component={AdminAnalytics} />} 
          />
      </Routes>
    </Suspense>
  );
}
