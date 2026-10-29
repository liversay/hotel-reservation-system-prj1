import './index.css'
import './App.css'
import Home from './pages/Home'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Product from './pages/Rooms';
import About from './pages/About';
import RoomDetails from './pages/RoomDetails';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import BookRoom from './pages/BookRoom';
import MyReservations from './pages/MyReservations';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import RequireAuth from './auth/RequireAuth';
import RequireAdmin from './auth/RequireAdmin';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
        <Route path="/products" element={<Product />} /> {/* Ruta para Products */}
        <Route path="/about" element={<About />} /> 
        <Route path="/productDetail" element={<RoomDetails />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/rooms/:id" element={<RoomDetails />} />
        <Route path="/book/:roomId" element={<BookRoom />} />
        <Route path="/my-reservations" element={<RequireAuth><MyReservations /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
