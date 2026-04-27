import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bug, Sparkles, MapPin, Camera } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-paper">
      {/* Header */}
      <header className="container mx-auto px-6 pt-12 pb-8">
        <div className="flex items-center gap-2 text-bamboo-dark mb-2">
          <MapPin className="h-5 w-5" />
          <span className="text-sm font-semibold tracking-widest uppercase">Travel Game Diary</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-foreground leading-tight max-w-3xl">
          My trips, <span className="text-primary">turned into games.</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-xl">
          Every memory becomes something you can play. Upload a photo, and AI invents a brand-new mini-game from it.
        </p>
      </header>

      {/* Game Grid */}
      <section className="container mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <span className="inline-block w-1 h-8 bg-accent rounded-full" />
          Memory Games
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Bug Forest Card */}
          <Link to="/games/bug-forest" className="group">
            <article className="relative overflow-hidden rounded-3xl shadow-card bg-gradient-forest h-80 p-6 flex flex-col justify-between transition-transform duration-300 group-hover:-translate-y-2">
              <div className="absolute inset-0 opacity-20">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute bg-bug rounded-full animate-float"
                    style={{
                      width: `${6 + Math.random() * 8}px`,
                      height: `${6 + Math.random() * 8}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                    }}
                  />
                ))}
              </div>
              <div className="relative">
                <span className="inline-block px-3 py-1 rounded-full bg-accent/90 text-accent-foreground text-xs font-bold uppercase tracking-wider">
                  Hangzhou · 云栖竹径
                </span>
              </div>
              <div className="relative text-primary-foreground">
                <Bug className="h-10 w-10 mb-3 animate-wiggle" />
                <h3 className="text-3xl font-black mb-1">云栖竹径吃虫子</h3>
                <p className="text-sm opacity-90">Upload a face. Run through the bamboo. Eat every bug in your path.</p>
              </div>
            </article>
          </Link>

          {/* AI Generator Card */}
          <Link to="/games/ai-create" className="group">
            <article className="relative overflow-hidden rounded-3xl shadow-card bg-gradient-sunrise h-80 p-6 flex flex-col justify-between transition-transform duration-300 group-hover:-translate-y-2">
              <div className="absolute inset-0 opacity-30">
                {[...Array(15)].map((_, i) => (
                  <Sparkles
                    key={i}
                    className="absolute text-primary-foreground animate-float"
                    style={{
                      width: `${10 + Math.random() * 14}px`,
                      height: `${10 + Math.random() * 14}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                    }}
                  />
                ))}
              </div>
              <div className="relative">
                <span className="inline-block px-3 py-1 rounded-full bg-foreground/20 text-primary-foreground text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  Anywhere · AI Powered
                </span>
              </div>
              <div className="relative text-primary-foreground">
                <Camera className="h-10 w-10 mb-3" />
                <h3 className="text-3xl font-black mb-1">Photo → Game</h3>
                <p className="text-sm opacity-95">Drop in a travel photo. AI dreams up a playable mini-game just for it.</p>
              </div>
            </article>
          </Link>

          {/* Coming Soon */}
          <article className="relative overflow-hidden rounded-3xl border-2 border-dashed border-border bg-card h-80 p-6 flex flex-col justify-center items-center text-center">
            <div className="text-6xl mb-4 opacity-40">🗺️</div>
            <h3 className="text-xl font-bold text-muted-foreground mb-2">More memories soon</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Each trip earns its own game. Generate one from a photo to fill this slot.
            </p>
          </article>
        </div>
      </section>

      <footer className="container mx-auto px-6 py-12 text-center text-sm text-muted-foreground">
        Made with 🎒 — a playable travelogue.
      </footer>
    </div>
  );
};

export default Index;
