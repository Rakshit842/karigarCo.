import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#eeeae0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <img
              src="/logo.png"
              alt="KarigarCo."
              className="h-16 w-auto object-contain mx-auto"
            />
          </a>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
