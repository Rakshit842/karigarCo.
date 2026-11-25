export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#eeeae0] flex items-center justify-center">
      <div className="text-center">
        <img
          src="/logo.png"
          alt="KarigarCo."
          className="h-16 w-auto object-contain mb-6"
        />
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-forest-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
