// src/App.jsx
import { Routes, Route } from 'react-router-dom'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import UpdatePassword from "./pages/UpdatePassword.jsx";
function App() {
  return (
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotPassword" element={<ForgotPassword />}  />
        <Route path="/update-password" element={<UpdatePassword />} />
      </Routes>
  )
}

export default App