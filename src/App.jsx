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
import PredictionsMenu from "./pages/PredictionsMenu.jsx";
import KnockoutPredictions from "./pages/KnockoutPredictions.jsx";
import MemberMenu from "./pages/MemberMenu.jsx";
import GroupStageResults from "./pages/GroupStageResults.jsx";

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
            <Route path="/GroupStagePredictions" element={<GroupStagePredictions />} />
            <Route path="/leagues/:leagueId" element={<LeagueDetail />} />
            <Route path="/predictions/groupstage/:userId" element={<ViewGroupStagePredictions />} />
            <Route path="/predictionsMenu" element={<PredictionsMenu />} />
            <Route path="/predictions/knockout/:round" element={<KnockoutPredictions />} />
            <Route path="/leagues/:leagueId/members/:userId" element={<MemberMenu />} />
            <Route path="/predictions/groupstage/result" element={<GroupStageResults />} />
            <Route path="/leagues/:leagueId/members/:userId/groupstage" element={<GroupStageResults />} />
        </Routes>
    )
}

export default App