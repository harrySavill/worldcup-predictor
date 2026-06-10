// src/App.jsx
import { Routes, Route } from 'react-router-dom'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import UpdatePassword from "./pages/UpdatePassword.jsx";
import Dashboard from './pages/Dashboard.jsx'
import CreateLeague from './pages/CreateLeague.jsx'
import JoinLeague from './pages/JoinLeague.jsx'
import Leagues from "./pages/Leagues.jsx";
import GroupStagePredictions from "./pages/GroupStagePredictions.jsx";
import LeagueDetail from "./pages/LeagueDetail.jsx";
import ViewGroupStagePredictions from "./pages/ViewGroupStagePredictions.jsx";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotPassword" element={<ForgotPassword />}  />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="leagues" element={<Leagues />} />
        <Route path="/leagues/create" element={<CreateLeague />} />
        <Route path="/leagues/join" element={<JoinLeague />} />
        <Route path="/predictions" element={<GroupStagePredictions />} />
        <Route path="/leagues/:leagueId" element={<LeagueDetail />} />
        <Route path="/predictions/groupstage/:userId" element={<ViewGroupStagePredictions />} />
      </Routes>
  )
}

export default App