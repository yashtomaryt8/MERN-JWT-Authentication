import { useContext, useState, useEffect, useRef } from 'react';
import { assets } from './../assets/assets';
import { useNavigate } from 'react-router-dom';
import { AppContext } from './../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Navbar = () => {

  const navigate = useNavigate();
  const { userData, backendUrl, setUserData, setIsLoggedin } = useContext(AppContext);

  // 🔹 State for controlling dropdown visibility (mobile-friendly)
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // 🔹 Function to send verification OTP
  const sendVerificationOtp = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + '/api/auth/send-verify-otp');

      if (data.success) {
        navigate('/email-verify');
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      toast.error(error.message);
    }
  };

  // 🔹 Logout function
  const logout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + '/api/auth/logout');

      if (data.success) {
        setIsLoggedin(false);
        setUserData(false);
        navigate('/');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 🔹 Toggle dropdown visibility
  const toggleMenu = () => setMenuOpen(!menuOpen);

  // 🔹 Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className='w-full flex justify-between items-center p-4 sm:p-6 sm:px-24 absolute top-0'>
      
      {/* Logo */}
      <img src={assets.logo} alt="Logo" className='w-28 sm:w-32 cursor-pointer' onClick={() => navigate('/')} />

      {/* If user is logged in */}
      {userData ? (
        <div className='relative' ref={menuRef}>
          {/* Avatar Circle */}
          <div
            className='w-8 h-8 flex justify-center items-center rounded-full bg-black text-white cursor-pointer select-none'
            onClick={toggleMenu}
          >
            {userData.name[0].toUpperCase()}
          </div>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className='absolute top-10 right-0 text-black rounded z-10'>
              <ul className='list-none m-0 p-2 bg-gray-100 text-sm shadow-md rounded'>
                {/* Verify Email (if not verified) */}
                {!userData.isAccountVerified && (
                  <li
                    onClick={() => {
                      sendVerificationOtp();
                      setMenuOpen(false);
                    }}
                    className='py-1 px-2 hover:bg-gray-200 cursor-pointer'
                  >
                    Verify Email
                  </li>
                )}

                {/* Logout */}
                <li
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className='py-1 px-2 hover:bg-gray-200 cursor-pointer pr-10'
                >
                  Logout
                </li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        // If not logged in
        <button
          onClick={() => navigate('/login')}
          className='flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100 transition-all cursor-pointer'
        >
          Login <img src={assets.arrow_icon} alt="arrow" />
        </button>
      )}
    </div>
  );
};

export default Navbar;
