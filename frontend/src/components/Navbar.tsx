import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-wide">
          Hotel Sparkling Awards
        </h1>
        <Link to="/login">
          <button className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition duration-200">
            Login
          </button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
