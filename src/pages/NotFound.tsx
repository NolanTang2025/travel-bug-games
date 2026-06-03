import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="sticker bg-riso-yellow text-riso-ink max-w-md w-full p-10 rotate--2 text-center">
        <p className="font-mono text-sm uppercase tracking-[0.25em] mb-3">
          Error · 404
        </p>
        <h1 className="font-display text-6xl text-chroma-lg mb-3">LOST?</h1>
        <p className="font-mono text-sm mb-6 text-riso-ink/75">
          This page isn't on our map. Maybe the bugs ate it.
        </p>
        <Link
          to="/"
          className="sticker inline-block bg-riso-ink text-background px-6 py-3 font-display uppercase tracking-wider"
        >
          ← Back home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
