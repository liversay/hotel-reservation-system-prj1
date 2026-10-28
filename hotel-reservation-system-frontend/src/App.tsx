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

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/products" element={<Product />} /> {/* Ruta para Products */}
        <Route path="/about" element={<About />} /> 
        <Route path="/productDetail" element={<RoomDetails />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/book/:roomId" element={<BookRoom />} />
        {/* Agrega otras rutas aquí */}
      </Routes>
    </Router>
  )
}

export default App
