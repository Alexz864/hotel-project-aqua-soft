import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const isAdmin = user?.role === 'admin';
  const isDataOperator = user?.role === 'data_operator';
  const isHotelManager = user?.role === 'hotel_manager';
  const canManageHotels = isAdmin || isDataOperator;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/">
          <h1 className="text-2xl font-semibold tracking-wide cursor-pointer hover:text-blue-100 transition-colors">
            Hotel Sparkling Awards
          </h1>
        </Link>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-blue-100">
                Welcome, {user?.username}
              </span>
              {isHotelManager && (
                <Link to="/manager">
                  <button className="bg-gray-800 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition duration-200">
                    My Hotels
                  </button>
                </Link>
              )}
              {canManageHotels && (
                <Link to="/hotels-management">
                  <button className="bg-gray-800 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition duration-200">
                    Hotels
                  </button>
                </Link>
              )}
              {isAdmin && (
                <Link to="/users">
                  <button className="bg-gray-800 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition duration-200">
                    Users
                  </button>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">
              <button className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition duration-200">
                Login
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;